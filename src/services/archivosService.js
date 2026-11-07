import { apiGet } from './api'

export function listarArchivos() {
  return apiGet('/archivos')
}

// Devuelve un Map mascotaId → URL de la foto de portada (o la primera imagen si no hay portada).
export function fotosPorMascota(archivos) {
  const fotos = new Map()
  if (!Array.isArray(archivos)) return fotos
  const imagenes = archivos
    .filter((archivo) => archivo.mascotaId != null && archivo.tipoMedio === 'IMAGEN' && archivo.estadoActivo !== false && archivo.url)
    .sort((a, b) => Number(Boolean(b.esPortada)) - Number(Boolean(a.esPortada)) || (a.orden ?? 0) - (b.orden ?? 0))
  for (const imagen of imagenes) {
    const id = String(imagen.mascotaId)
    if (!fotos.has(id)) fotos.set(id, imagen.url)
  }
  return fotos
}
