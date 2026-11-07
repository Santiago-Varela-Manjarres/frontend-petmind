import { apiGet, apiSend } from './api'

const BASE = '/solicitudes-adopcion'

export function crearSolicitud({ usuarioId, mascotaId, datosHogar }) {
  return apiSend('POST', BASE, { usuarioId, mascotaId, datosHogar })
}

export function obtenerSolicitud(id) {
  return apiGet(`${BASE}/${encodeURIComponent(id)}`)
}

export function listarSolicitudesDeUsuario(usuarioId) {
  return apiGet(`${BASE}/por-usuario?usuarioId=${encodeURIComponent(usuarioId)}`)
}

export function listarSolicitudesDeFundacion(fundacionId) {
  return apiGet(`${BASE}/por-fundacion?fundacionId=${encodeURIComponent(fundacionId)}`)
}

// La fundación revisa, pide documentos, aprueba o rechaza. usuarioId es quien decide.
export function cambiarEstadoSolicitud(id, { usuarioId, estado, mensaje }) {
  return apiSend('PATCH', `${BASE}/${encodeURIComponent(id)}/estado`, { usuarioId, estado, mensaje: mensaje || null })
}

// La persona responde cuando la fundación le pide documentos.
export function responderSolicitud(id, { usuarioId, respuesta }) {
  return apiSend('PATCH', `${BASE}/${encodeURIComponent(id)}/respuesta`, { usuarioId, respuesta })
}
