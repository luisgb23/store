import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { REFRESH_STORAGE_KEY, setAccessToken, setAuthLostHandler } from '../api/client.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Al cargar la app: recuperar la sesión con el refresh token guardado (si hay).
  useEffect(() => {
    let active = true

    // Si la sesión ya no se puede renovar, el cliente avisa y la app vuelve al estado "sin sesión".
    setAuthLostHandler(() => setUser(null))

    authApi.restoreSession().then((restoredUser) => {
      if (active) {
        setUser(restoredUser)
        setLoading(false)
      }
    })

    return () => {
      active = false
      setAuthLostHandler(null)
    }
  }, [])

  // Si el usuario cierra sesión en otra pestaña, esta también se cierra.
  useEffect(() => {
    function onStorage(event) {
      if (event.key === REFRESH_STORAGE_KEY && event.newValue === null) {
        setAccessToken(null)
        setUser(null)
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = useCallback(async (email, password) => {
    const loggedUser = await authApi.login(email, password)
    setUser(loggedUser)
    return loggedUser
  }, [])

  const register = useCallback(async (nombre, email, password) => {
    const newUser = await authApi.register(nombre, email, password)
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    await authApi.logout()
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: user !== null,
      isAdmin: user?.rol === 'admin',
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
