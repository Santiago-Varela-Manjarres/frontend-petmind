import { apiGet } from './api'

export function listarMascotasDisponibles() {
  return apiGet(
    '/mascotas/por-estado?estadoPublicacion=PUBLICADA&estadoAdopcion=DISPONIBLE',
  )
}