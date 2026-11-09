import { request } from './client.js'

export const listCategorias = (signal) => request('GET', '/categorias', { signal })

export const getCategoria = (id) => request('GET', `/categorias/${id}`)

export const createCategoria = (data) => request('POST', '/categorias', { body: data })

export const updateCategoria = (id, data) => request('PUT', `/categorias/${id}`, { body: data })

export const deleteCategoria = (id) => request('DELETE', `/categorias/${id}`)
