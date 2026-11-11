import { apiGet } from './api'

export function listarFundaciones() {
  return apiGet('/fundaciones')
}

export function obtenerFundacion(id) {
  return apiGet(`/fundaciones/${encodeURIComponent(id)}`)
}
