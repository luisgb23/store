import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessages } from '../api/client.js'
import Alert from '../components/Alert.jsx'
import { useAuth } from '../context/authContext.js'

export default function Register() {
  const { register } = useAuth()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors([])
    setSubmitting(true)

    try {
      // Al registrarse la API ya inicia la sesión; GuestRoute redirige.
      await register(nombre.trim(), email.trim(), password)
    } catch (err) {
      setErrors(errorMessages(err))
      setSubmitting(false)
    }
  }

  return (
    <section className="auth">
      <h1>Crear cuenta</h1>
      <p className="lead">Las cuentas nuevas pueden crear y editar. Solo un administrador puede eliminar.</p>

      <Alert type="error" messages={errors} />

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            className="input"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            aria-describedby="password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span id="password-hint" className="field-hint">
            Entre 8 y 72 caracteres.
          </span>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </div>
      </form>

      <p className="hint">
        ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>.
      </p>
    </section>
  )
}
