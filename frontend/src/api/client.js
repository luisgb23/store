/**
 * Cliente HTTP de la API. No depende de React: solo fetch, localStorage y navigator.locks.
 *
 * Manejo de sesión:
 *  - El access token (JWT, dura poco) vive solo en memoria.
 *  - El refresh token se guarda en localStorage para sobrevivir a recargas de la página.
 *  - Si una petición responde 401, se renueva el par de tokens con /auth/refresh y se
 *    reintenta una vez. Los refresh tokens de esta API sirven UNA sola vez (rotación),
 *    por eso la renovación está serializada: una sola petición /auth/refresh a la vez,
 *    aunque haya varias pantallas o pestañas pidiéndola.
 */

export const REFRESH_STORAGE_KEY = 'tienda.refresh_token'

let baseUrl = (
  (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_API_URL) ||
  'http://localhost:8080'
).replace(/\/+$/, '')

let accessToken = null
let authLostHandler = null
let refreshPromise = null

// ---------------------------------------------------------------- configuración

export function configure({ baseUrl: url } = {}) {
  if (url) baseUrl = url.replace(/\/+$/, '')
}

/** Función a llamar cuando la sesión ya no se puede renovar (hay que volver a ingresar). */
export function setAuthLostHandler(handler) {
  authLostHandler = handler
}

// ---------------------------------------------------------------------- errores

export class ApiError extends Error {
  constructor(message, status = 0, errors = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status // 0 = no hubo respuesta (servidor caído, sin red)
    this.errors = errors
  }

  /** Lista de mensajes para mostrar al usuario. */
  messages() {
    return Array.isArray(this.errors) && this.errors.length > 0 ? this.errors : [this.message]
  }
}

export function errorMessages(err) {
  return err instanceof ApiError ? err.messages() : [err?.message || 'Ocurrió un error inesperado.']
}

// ----------------------------------------------------------------------- tokens

function storage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token
}

export function getRefreshToken() {
  try {
    return storage()?.getItem(REFRESH_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

export function saveTokens(tokens) {
  accessToken = tokens.access_token
  try {
    storage()?.setItem(REFRESH_STORAGE_KEY, tokens.refresh_token)
  } catch {
    // Sin localStorage la sesión dura solo hasta recargar la página.
  }
}

export function clearSession() {
  accessToken = null
  try {
    storage()?.removeItem(REFRESH_STORAGE_KEY)
  } catch {
    // nada que limpiar
  }
}

// ------------------------------------------------------------------------ fetch

function buildUrl(path, query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.append(key, value)
  }
  const qs = params.toString()
  return `${baseUrl}${path}${qs ? `?${qs}` : ''}`
}

async function rawRequest(method, path, { body, query, signal, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError('No se pudo conectar con el servidor. Revisá que la API esté en marcha.', 0)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message ?? `El servidor respondió con el error ${response.status}.`,
      response.status,
      payload?.errors ?? null,
    )
  }

  return payload
}

// -------------------------------------------------------------------- renovación

function withRefreshLock(task) {
  // Web Locks serializa la renovación entre pestañas del mismo navegador.
  const locks = globalThis.navigator?.locks
  return locks ? locks.request('tienda-refresh-token', task) : task()
}

async function doRefresh() {
  return withRefreshLock(async () => {
    // Se lee el token DENTRO del lock: otra pestaña pudo rotarlo mientras esperábamos.
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new ApiError('No hay una sesión iniciada.', 401)

    try {
      const response = await rawRequest('POST', '/auth/refresh', {
        body: { refresh_token: refreshToken },
      })
      saveTokens(response.data)
      return response.data
    } catch (err) {
      // Token vencido, revocado o inválido: la sesión terminó.
      // Un fallo de red (status 0) no cierra la sesión: se podrá reintentar.
      if (err.status === 401 || err.status === 422) clearSession()
      throw err
    }
  })
}

/** Renueva la sesión. Las llamadas simultáneas comparten una única petición. */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// ---------------------------------------------------------------------- request

/**
 * Hace una petición a la API y devuelve el JSON completo ({ success, message, data, meta }).
 * Lanza ApiError si la API responde con error.
 *
 * Opciones: body, query, signal (AbortController) y auth (true por defecto: envía el token).
 */
export async function request(method, path, { body, query, auth = true, signal } = {}) {
  const tokenUsed = accessToken
  const send = (token) => rawRequest(method, path, { body, query, signal, token })

  try {
    return await send(auth ? tokenUsed : null)
  } catch (err) {
    if (!auth || err.status !== 401 || !getRefreshToken()) throw err

    // Si otra petición ya renovó el token mientras esta viajaba, alcanza con reintentar.
    const alreadyRenewed = accessToken !== null && accessToken !== tokenUsed

    if (!alreadyRenewed) {
      try {
        await refreshSession()
      } catch (refreshErr) {
        if (getRefreshToken() === null) {
          // La sesión se cerró: la pantalla debe volver al login.
          if (authLostHandler) authLostHandler()
          throw err
        }
        throw refreshErr
      }
    }

    return send(accessToken)
  }
}
