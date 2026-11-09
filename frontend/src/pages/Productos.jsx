import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCategorias } from '../api/categorias.js'
import { errorMessages } from '../api/client.js'
import { deleteProducto, listProductos } from '../api/productos.js'
import Alert from '../components/Alert.jsx'
import Pagination from '../components/Pagination.jsx'
import { useAuth } from '../context/authContext.js'
import { formatPrice } from '../lib/format.js'
import { useFlash } from '../lib/useFlash.js'

const PER_PAGE = 10

function StockLabel({ stock }) {
  if (stock === 0) return <span className="stock stock-out">Agotado</span>
  if (stock <= 5) return <span className="stock stock-low">Quedan {stock}</span>
  return <span className="stock stock-ok">{stock}</span>
}

export default function Productos() {
  const { isAuthenticated, isAdmin } = useAuth()
  const [message, setMessage] = useFlash()

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // La búsqueda espera a que el usuario deje de escribir.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Categorías para el filtro.
  useEffect(() => {
    const controller = new AbortController()
    listCategorias(controller.signal)
      .then((res) => setCategorias(res.data))
      .catch(() => {
        // Sin categorías el filtro queda vacío; el listado sigue funcionando.
      })
    return () => controller.abort()
  }, [])

  // Listado de productos.
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    listProductos(
      { page, per_page: PER_PAGE, search, categoria_id: categoriaId },
      controller.signal,
    )
      .then((res) => {
        setItems(res.data)
        setPagination(res.meta.pagination)
        setErrors([])
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setErrors(errorMessages(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [page, search, categoriaId, reloadKey])

  async function handleDelete(producto) {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return

    setMessage('')
    setErrors([])

    try {
      await deleteProducto(producto.id)
      setMessage('Producto eliminado.')
      // Si era el último de la página, volver a la anterior.
      if (items.length === 1 && page > 1) setPage(page - 1)
      else setReloadKey((key) => key + 1)
    } catch (err) {
      setErrors(errorMessages(err))
    }
  }

  const hasFilters = search !== '' || categoriaId !== ''

  return (
    <>
      <div className="page-head">
        <h1>Productos</h1>
        {isAuthenticated && (
          <Link className="btn btn-primary" to="/productos/nuevo">
            Nuevo producto
          </Link>
        )}
      </div>

      {!isAuthenticated && (
        <p className="hint">
          <Link to="/login">Ingresá</Link> para crear y editar productos.
        </p>
      )}

      <Alert type="success" messages={message ? [message] : []} />
      <Alert type="error" messages={errors} />

      <div className="toolbar">
        <input
          type="search"
          className="input"
          placeholder="Buscar por nombre o descripción"
          aria-label="Buscar productos"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className="input"
          aria-label="Filtrar por categoría"
          value={categoriaId}
          onChange={(e) => {
            setCategoriaId(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading && items.length === 0 ? (
        <p className="muted" role="status">
          Cargando productos…
        </p>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>
            {hasFilters
              ? 'Ningún producto coincide con los filtros.'
              : 'Todavía no hay productos.'}
          </p>
          {isAuthenticated && !hasFilters && (
            <Link className="btn btn-primary" to="/productos/nuevo">
              Crear el primer producto
            </Link>
          )}
        </div>
      ) : (
        <div className={`table-wrap${loading ? ' is-loading' : ''}`} aria-busy={loading}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col">Stock</th>
                <th scope="col" className="num">
                  Precio
                </th>
                {isAuthenticated && (
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((producto) => (
                <tr key={producto.id}>
                  <td>
                    <strong className="item-name">{producto.nombre}</strong>
                    {producto.descripcion && (
                      <span className="item-desc">{producto.descripcion}</span>
                    )}
                  </td>
                  <td>
                    {producto.categoria_nombre ?? <span className="muted">Sin categoría</span>}
                  </td>
                  <td>
                    <StockLabel stock={producto.stock} />
                  </td>
                  <td className="num">
                    <span className="price-tag">{formatPrice(producto.precio)}</span>
                  </td>
                  {isAuthenticated && (
                    <td className="actions">
                      <Link
                        className="btn btn-secondary btn-sm"
                        to={`/productos/${producto.id}/editar`}
                      >
                        Editar
                      </Link>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(producto)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        pagination={pagination}
        onPageChange={setPage}
        noun={['producto', 'productos']}
      />
    </>
  )
}
