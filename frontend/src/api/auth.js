import {
  clearSession,
  getRefreshToken,
  refreshSession,
  request,
  saveTokens,
} from './client.js'

/** Inicia sesión. Guarda los tokens y devuelve el usuario ({ id, nombre, email, rol }). */
export async function login(email, password) {
  const res = await request('POST', '/auth/login', { body: { email, password }, auth: false })
  saveTokens(res.data.tokens)
  return res.data.user
}

/** Crea una cuenta (rol "user") e inicia sesión. */
export async function register(nombre, email, password) {
  const res = await request('POST', '/auth/register', {
    body: { nombre, email, password },
    auth: false,
  })
  saveTokens(res.data.tokens)
  return res.data.user
}

/** Cierra la sesión local y revoca el refresh token en el servidor. */
export async function logout() {
  const refreshToken = getRefreshToken()
  clearSession()
  if (!refreshToken) return

  try {
    await request('POST', '/auth/logout', { body: { refresh_token: refreshToken }, auth: false })
  } catch {
    // La sesión local ya se cerró; si el servidor no responde, el token vence solo.
  }
}

export async function fetchCurrentUser() {
  const res = await request('GET', '/auth/me')
  return res.data
}

/**
 * Al abrir o recargar la página: si hay un refresh token guardado, lo canjea por un
 * access token nuevo y devuelve el usuario. Devuelve null si no hay sesión recuperable.
 */
export async function restoreSession() {
  if (!getRefreshToken()) return null

  try {
    await refreshSession()
    return await fetchCurrentUser()
  } catch {
    return null
  }
}
