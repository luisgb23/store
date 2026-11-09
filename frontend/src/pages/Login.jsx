import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessages } from '../api/client.js'
import Alert from '../components/Alert.jsx'
import { useAuth } from '../context/authContext.js'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors([])
    setSubmitting(true)

    try {
      // Si sale bien, GuestRoute detecta la sesión y redirige a donde el usuario iba.
      await login(email.trim(), password)
    } catch (err) {
      setErrors(
        err.status === 401 ? ['El email o la contraseña no son correctos.'] : errorMessages(err),
      )
      setSubmitting(false)
    }
  }

  return (
    <section className="auth">
      <h1>Ingresar</h1>
      <p className="lead">Con tu cuenta podés crear y editar productos y categorías.</p>

      <Alert type="error" messages={errors} />

      <form className="form" onSubmit={handleSubmit}>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </div>
      </form>

      <p className="hint">
        ¿Todavía no tenés cuenta? <Link to="/registro">Creá una</Link>.
      </p>
    </section>
  )
}
