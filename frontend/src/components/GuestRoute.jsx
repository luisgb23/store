import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'

/**
 * Para login y registro: si ya hay sesión, redirige a la pantalla que el usuario
 * quería abrir antes de ingresar (o a Productos).
 */
export default function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="muted" role="status">Cargando…</p>

  if (user) {
    const from = location.state?.from
    const destination = from ? `${from.pathname}${from.search ?? ''}` : '/productos'
    return <Navigate to={destination} replace />
  }

  return children
}
