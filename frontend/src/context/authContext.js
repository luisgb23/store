import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/**
 * Estado de sesión para cualquier componente:
 * { user, loading, isAuthenticated, isAdmin, login, register, logout }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return context
}
