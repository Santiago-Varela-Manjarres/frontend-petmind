import { apiGet, apiSend } from './api'

// Favoritos de las cuentas del backend. Cada favorito apunta a una sola cosa: una mascota o una campaña.
// El backend no deja guardar dos veces lo mismo (responde 409) y al eliminar lo desactiva.

export function listarFavoritosDeUsuario(usuarioId) {
  return apiGet(`/favoritos/por-usuario?usuarioId=${encodeURIComponent(usuarioId)}`)
}

export function crearFavorito({ usuarioId, mascotaId = null, campanaId = null }) {
  return apiSend('POST', '/favoritos', { usuarioId, mascotaId, campanaId })
}

export function eliminarFavorito(id) {
  return apiSend('DELETE', `/favoritos/${encodeURIComponent(id)}`)
}
