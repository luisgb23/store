import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'

export default function Layout() {
  const { user, loading, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/productos')
  }

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/productos" className="brand">
            Tienda
          </Link>

          <nav className="nav" aria-label="Principal">
            <NavLink to="/productos">Productos</NavLink>
            <NavLink to="/categorias">Categorías</NavLink>
          </nav>

          <div className="session">
            {loading ? null : user ? (
              <>
                <span className="session-name">{user.nombre}</span>
                <span className={`role${isAdmin ? ' role-admin' : ''}`}>
                  {isAdmin ? 'Administrador' : 'Usuario'}
                </span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link className="session-link" to="/login">
                  Ingresar
                </Link>
                <Link className="btn btn-primary btn-sm" to="/registro">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="contenido" className="container">
        <Outlet />
      </main>
    </>
  )
}
