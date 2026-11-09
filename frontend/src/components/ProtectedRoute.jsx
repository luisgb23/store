import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'

/**
 * Protege una pantalla:
 *  - sin sesión: manda al login y recuerda a dónde quería ir ("from"), para volver después;
 *  - con "roles" (por ejemplo ['admin']): además exige uno de esos roles.
 *
 * Esto mejora la experiencia, pero la seguridad real está en la API, que valida
 * el token y el rol en cada petición.
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="muted" role="status">Cargando…</p>

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  if (roles && !roles.includes(user.rol)) {
    return (
      <section className="notice">
        <h1>Sin permisos</h1>
        <p>Tu cuenta no puede acceder a esta página.</p>
        <Link to="/productos">Volver a productos</Link>
      </section>
    )
  }

  return children
}
