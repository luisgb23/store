import { Navigate, Route, Routes } from 'react-router-dom'
import GuestRoute from './components/GuestRoute.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import CategoriaForm from './pages/CategoriaForm.jsx'
import Categorias from './pages/Categorias.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import ProductoForm from './pages/ProductoForm.jsx'
import Productos from './pages/Productos.jsx'
import Register from './pages/Register.jsx'

/**
 * Públicas: ver productos y categorías (la API permite leer sin cuenta).
 * Protegidas: crear y editar (requieren sesión). Eliminar solo se ofrece a administradores.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/productos" replace />} />

        <Route path="productos" element={<Productos />} />
        <Route
          path="productos/nuevo"
          element={
            <ProtectedRoute>
              <ProductoForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="productos/:id/editar"
          element={
            <ProtectedRoute>
              <ProductoForm />
            </ProtectedRoute>
          }
        />

        <Route path="categorias" element={<Categorias />} />
        <Route
          path="categorias/nueva"
          element={
            <ProtectedRoute>
              <CategoriaForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="categorias/:id/editar"
          element={
            <ProtectedRoute>
              <CategoriaForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="registro"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
