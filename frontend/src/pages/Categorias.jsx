import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteCategoria, listCategorias } from '../api/categorias.js'
import { errorMessages } from '../api/client.js'
import Alert from '../components/Alert.jsx'
import { useAuth } from '../context/authContext.js'
import { useFlash } from '../lib/useFlash.js'

export default function Categorias() {
  const { isAuthenticated, isAdmin } = useAuth()
  const [message, setMessage] = useFlash()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)

    listCategorias(controller.signal)
      .then((res) => {
        setItems(res.data)
        setErrors([])
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setErrors(errorMessages(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reloadKey])

  async function handleDelete(categoria) {
    const confirmed = window.confirm(
      `¿Eliminar la categoría "${categoria.nombre}"? Sus productos quedarán sin categoría.`,
    )
    if (!confirmed) return

    setMessage('')
    setErrors([])

    try {
      await deleteCategoria(categoria.id)
      setMessage('Categoría eliminada.')
      setReloadKey((key) => key + 1)
    } catch (err) {
      setErrors(errorMessages(err))
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Categorías</h1>
        {isAuthenticated && (
          <Link className="btn btn-primary" to="/categorias/nueva">
            Nueva categoría
          </Link>
        )}
      </div>

      {!isAuthenticated && (
        <p className="hint">
          <Link to="/login">Ingresá</Link> para crear y editar categorías.
        </p>
      )}

      <Alert type="success" messages={message ? [message] : []} />
      <Alert type="error" messages={errors} />

      {loading && items.length === 0 ? (
        <p className="muted" role="status">
          Cargando categorías…
        </p>
      ) : items.length === 0 ? (
        <div className="empty">
          <p>Todavía no hay categorías.</p>
          {isAuthenticated && (
            <Link className="btn btn-primary" to="/categorias/nueva">
              Crear la primera categoría
            </Link>
          )}
        </div>
      ) : (
        <div className={`table-wrap${loading ? ' is-loading' : ''}`} aria-busy={loading}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Categoría</th>
                <th scope="col">Descripción</th>
                {isAuthenticated && (
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((categoria) => (
                <tr key={categoria.id}>
                  <td>
                    <strong className="item-name">{categoria.nombre}</strong>
                  </td>
                  <td>
                    {categoria.descripcion ?? <span className="muted">Sin descripción</span>}
                  </td>
                  {isAuthenticated && (
                    <td className="actions">
                      <Link
                        className="btn btn-secondary btn-sm"
                        to={`/categorias/${categoria.id}/editar`}
                      >
                        Editar
                      </Link>
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(categoria)}
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
    </>
  )
}
