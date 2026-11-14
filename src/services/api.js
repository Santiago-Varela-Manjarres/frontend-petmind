const API_URL = import.meta.env.VITE_API_URL

// Error de la API con el código HTTP y el mensaje que manda el backend ({ "mensaje": "..." }).
// status 0 = no hubo respuesta (sin conexión o el servidor no despertó).
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(ruta, options) {
  if (!API_URL) {
    throw new ApiError('Falta configurar VITE_API_URL', 0)
  }

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, options)
  } catch {
    throw new ApiError('No pudimos conectarnos con el servidor. Revisa tu conexión e inténtalo de nuevo.', 0)
  }

  if (!respuesta.ok) {
    let mensaje = `Error del servidor: ${respuesta.status}`
    try {
      const cuerpo = await respuesta.json()
      if (cuerpo?.mensaje) mensaje = cuerpo.mensaje
    } catch {
      // la respuesta no trae JSON: se deja el mensaje con el código
    }
    throw new ApiError(mensaje, respuesta.status)
  }

  return respuesta.status === 204 ? null : respuesta.json()
}

// Consultas GET en curso por ruta. Si dos pantallas o hooks piden lo mismo a la vez (p. ej. /archivos y /mascotas
// en "Mis favoritos"), comparten una sola petición. Al terminar se olvida: la siguiente consulta trae datos nuevos.
const enCurso = new Map()

export function apiGet(ruta) {
  let pendiente = enCurso.get(ruta)
  if (!pendiente) {
    pendiente = request(ruta)
    enCurso.set(ruta, pendiente)
    const olvidar = () => {
      if (enCurso.get(ruta) === pendiente) enCurso.delete(ruta)
    }
    pendiente.then(olvidar, olvidar)
  }
  // Cada quien recibe su propia copia: si una pantalla ordena o cambia la lista, no afecta a la otra.
  return pendiente.then((datos) => (datos == null ? datos : structuredClone(datos)))
}

export function apiSend(metodo, ruta, cuerpo) {
  return request(ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
}
