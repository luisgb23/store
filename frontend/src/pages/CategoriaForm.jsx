import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCategoria, getCategoria, updateCategoria } from '../api/categorias.js'
import { errorMessages } from '../api/client.js'
import Alert from '../components/Alert.jsx'

const EMPTY_FORM = { nombre: '', descripcion: '' }

/** Crear (/categorias/nueva) y editar (/categorias/:id/editar) comparten esta pantalla. */
export default function CategoriaForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    if (!editing) return undefined

    let active = true

    getCategoria(id)
      .then((res) => {
        if (active) {
          setForm({ nombre: res.data.nombre, descripcion: res.data.descripcion ?? '' })
        }
      })
      .catch((err) => active && setErrors(errorMessages(err)))
      .finally(() => active && setLoading(false))

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
    }

    try {
      if (editing) await updateCategoria(id, payload)
      else await createCategoria(payload)

      navigate('/categorias', { state: { flash: 'Categoría guardada.' } })
    } catch (err) {
      setErrors(errorMessages(err))
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <p className="muted" role="status">
        Cargando categoría…
      </p>
    )
  }

  return (
    <section>
      <div className="page-head">
        <h1>{editing ? 'Editar categoría' : 'Nueva categoría'}</h1>
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
            maxLength={100}
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
            maxLength={255}
            value={form.descripcion}
            onChange={updateField}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar categoría'}
          </button>
          <Link className="btn btn-secondary" to="/categorias">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}
