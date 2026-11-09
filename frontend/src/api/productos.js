import { request } from './client.js'

/** params: { page, per_page, search, categoria_id }. Los vacíos no se envían. */
export const listProductos = (params, signal) =>
  request('GET', '/productos', { query: params, signal })

export const getProducto = (id) => request('GET', `/productos/${id}`)

export const createProducto = (data) => request('POST', '/productos', { body: data })

export const updateProducto = (id, data) => request('PUT', `/productos/${id}`, { body: data })

export const deleteProducto = (id) => request('DELETE', `/productos/${id}`)
