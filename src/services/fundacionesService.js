import { apiGet } from './api'

export function obtenerFundacion(id) {
  return apiGet(`/fundaciones/${encodeURIComponent(id)}`)
}
