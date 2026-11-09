import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listCategorias } from '../api/categorias.js'
import { errorMessages } from '../api/client.js'
import { createProducto, getProducto, updateProducto } from '../api/productos.js'
import Alert from '../components/Alert.jsx'

const EMPTY_FORM = { nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '' }

/** Crear (/productos/nuevo) y editar (/productos/:id/editar) comparten esta pantalla. */
export default function ProductoForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    let active = true

    listCategorias()
      .then((res) => active && setCategorias(res.data))
      .catch((err) => active && setErrors(errorMessages(err)))

    if (editing) {
      getProducto(id)
        .then((res) => {
          if (!active) return
          const producto = res.data
          setForm({
            nombre: producto.nombre,
            descripcion: producto.descripcion ?? '',
            precio: String(producto.precio),
            stock: String(producto.stock),
            categoria_id: producto.categoria_id === null ? '' : String(producto.categoria_id),
          })
        })
        .catch((err) => active && setErrors(errorMessages(err)))
        .finally(() => active && setLoading(false))
    }

    return () => {
      active = false
    }
  }, [id, editing])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors([])
    setSaving(true)

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio: Number(form.precio),
      stock: Number(form.stock),
      categoria_id: form.categoria_id === '' ? null : Number(form.categoria_id),
    }

    try {
      if (editing) await updateProducto(id, payload)
      else await createProducto(payload)

      navigate('/productos', { state: { flash: 'Producto guardado.' } })
    } catch (err) {
      setErrors(errorMessages(err))
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <p className="muted" role="status">
        Cargando producto…
      </p>
    )
  }

  return (
    <section>
      <div className="page-head">
        <h1>{editing ? 'Editar producto' : 'Nuevo producto'}</h1>
      </div>

      <Alert type="error" messages={errors} />

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            className="input"
            type="text"
            required
            maxLength={150}
            value={form.nombre}
            onChange={updateField}
          />
        </div>

        <div className="field">
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            className="input"
            rows={3}
            value={form.descripcion}
            onChange={updateField}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="precio">Precio</label>
            <input
              id="precio"
              name="precio"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              value={form.precio}
              onChange={updateField}
            />
          </div>

          <div className="field">
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              name="stock"
              className="input"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              required
              value={form.stock}
              onChange={updateField}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="categoria_id">Categoría</label>
          <select
            id="categoria_id"
            name="categoria_id"
            className="input"
            value={form.categoria_id}
            onChange={updateField}
          >
            <option value="">Sin categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={String(categoria.id)}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar producto'}
          </button>
          <Link className="btn btn-secondary" to="/productos">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}
