import { apiGet, apiSend } from './api'

export function listarMascotasDisponibles() {
  return apiGet(
    '/mascotas/por-estado?estadoPublicacion=PUBLICADA&estadoAdopcion=DISPONIBLE',
  )
}

// Todas las mascotas activas, en cualquier estado (favoritos y panel de administración).
export function listarMascotas() {
  return apiGet('/mascotas')
}

// Las de una fundación, también las que están en borrador, pausadas o adoptadas (panel de la fundación).
export function listarMascotasDeFundacion(fundacionId) {
  return apiGet(`/mascotas/por-fundacion?fundacionId=${encodeURIComponent(fundacionId)}`)
}

export function obtenerMascota(id) {
  return apiGet(`/mascotas/${encodeURIComponent(id)}`)
}

export function crearMascota(datos) {
  return apiSend('POST', '/mascotas', datos)
}

export function actualizarMascota(id, datos) {
  return apiSend('PUT', `/mascotas/${encodeURIComponent(id)}`, datos)
}
