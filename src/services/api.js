const API_URL = import.meta.env.VITE_API_URL

export async function apiGet(ruta) {
  if (!API_URL) {
    throw new Error('Falta configurar VITE_API_URL')
  }

  const respuesta = await fetch(`${API_URL}${ruta}`)

  if (!respuesta.ok) {
    throw new Error(`Error del servidor: ${respuesta.status}`)
  }

  return respuesta.json()
}