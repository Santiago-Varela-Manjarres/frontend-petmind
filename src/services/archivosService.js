import { apiGet, apiSend } from './api'

export function listarArchivos() {
  return apiGet('/archivos')
}

export function listarArchivosDeMascota(mascotaId) {
  return apiGet(`/archivos/por-mascota?mascotaId=${encodeURIComponent(mascotaId)}`)
}

// El backend guarda solo el enlace de cada foto (máximo 500 caracteres): una imagen subida desde el
// equipo (data:…) no cabe, por eso los formularios piden un enlace o una foto de la galería del sitio.
// Solo https: el sitio publicado va por https y el navegador bloquea o no carga las imágenes por http.
export const MAX_URL = 500

export function esEnlaceDeFoto(url = '') {
  const valor = url.trim()
  return valor.length > 0 && valor.length <= MAX_URL && (/^https:\/\/\S+$/i.test(valor) || /^\/img\/\S+$/.test(valor))
}

function datosFoto(url, indice) {
  return {
    url,
    tipoMedio: 'IMAGEN',
    categoria: indice === 0 ? 'PORTADA' : 'GALERIA',
    esPortada: indice === 0,
    orden: indice + 1,
  }
}

// Deja en el backend las fotos de una mascota en el orden pedido (la primera es la portada):
// crea las nuevas, reordena las que siguen y desactiva las que se quitaron.
// Las peticiones no dependen entre sí (cada foto lleva su orden), así que se envían a la vez. Se espera a que
// terminen todas antes de avisar un error: así, al volver a la lista, ninguna sigue en camino.
export async function guardarFotosDeMascota(mascotaId, urls, anteriores = []) {
  const libres = [...anteriores]
  const peticiones = []
  for (const [indice, url] of urls.entries()) {
    const posicion = libres.findIndex((archivo) => archivo.url === url)
    const datos = datosFoto(url, indice)
    if (posicion === -1) {
      peticiones.push(apiSend('POST', '/archivos', { ...datos, mascotaId }))
      continue
    }
    const [existente] = libres.splice(posicion, 1)
    if (existente.orden !== datos.orden || Boolean(existente.esPortada) !== datos.esPortada || existente.categoria !== datos.categoria) {
      peticiones.push(apiSend('PUT', `/archivos/${encodeURIComponent(existente.id)}`, datos))
    }
  }
  for (const sobrante of libres) {
    peticiones.push(apiSend('DELETE', `/archivos/${encodeURIComponent(sobrante.id)}`))
  }
  const fallida = (await Promise.allSettled(peticiones)).find((resultado) => resultado.status === 'rejected')
  if (fallida) throw fallida.reason
}

export function crearPortadaDeCampana(campanaId, url) {
  return apiSend('POST', '/archivos', { ...datosFoto(url, 0), campanaId })
}

// Portada (o la primera imagen) de cada mascota o campaña: Map id → URL.
function portadas(archivos, campo) {
  const fotos = new Map()
  if (!Array.isArray(archivos)) return fotos
  const imagenes = archivos
    .filter((archivo) => archivo[campo] != null && archivo.tipoMedio === 'IMAGEN' && archivo.estadoActivo !== false && archivo.url)
    .sort((a, b) => Number(Boolean(b.esPortada)) - Number(Boolean(a.esPortada)) || (a.orden ?? 0) - (b.orden ?? 0))
  for (const imagen of imagenes) {
    const id = String(imagen[campo])
    if (!fotos.has(id)) fotos.set(id, imagen.url)
  }
  return fotos
}

// Devuelve un Map mascotaId → URL de la foto de portada (o la primera imagen si no hay portada).
export function fotosPorMascota(archivos) {
  return portadas(archivos, 'mascotaId')
}

export function fotosPorCampana(archivos) {
  return portadas(archivos, 'campanaId')
}
