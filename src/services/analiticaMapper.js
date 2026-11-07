// Adapta la respuesta de la API de analítica (Python) a lo que pintan las gráficas.
// Cada colección de Python nombra distinto la etiqueta (categoria, especie, fundacion, campana) y el valor
// (cantidad, total); aquí todas quedan como { label, value }. Python pasa los textos a minúsculas y las
// categorías a MAYÚSCULAS, así que también se dejan legibles ("EN_REVISION" → "En revisión").

const especies = { PERRO: 'Perro', GATO: 'Gato', OTRO: 'Otro' }

// Valores de EstadoSolicitud en el backend.
const estadosSolicitud = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  ENTREVISTA: 'Entrevista',
  VISITA_HOGAR: 'Visita al hogar',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
}

const palabrasMenores = new Set(['a', 'al', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'para', 'por', 'y'])

// "HUELLAS DE ESPERANZA" o "huellas de esperanza" → "Huellas de Esperanza"
function enTitulo(texto) {
  return String(texto)
    .toLocaleLowerCase('es-CO')
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra, indice) =>
      indice > 0 && palabrasMenores.has(palabra) ? palabra : palabra.charAt(0).toLocaleUpperCase('es-CO') + palabra.slice(1),
    )
    .join(' ')
}

// "VISITA_HOGAR" → "Visita hogar" para un valor que todavía no esté en las tablas de arriba.
function enFrase(texto) {
  const limpio = String(texto).replace(/_/g, ' ').toLocaleLowerCase('es-CO')
  return limpio.charAt(0).toLocaleUpperCase('es-CO') + limpio.slice(1)
}

function serie(lista, campoEtiqueta, campoValor, nombrar) {
  if (!Array.isArray(lista)) return []
  return lista
    .map((item) => ({ label: nombrar(item?.[campoEtiqueta] ?? 'Sin dato'), value: Number(item?.[campoValor]) || 0 }))
    .filter((item) => item.value > 0)
}

const especie = (valor) => especies[String(valor).toUpperCase()] ?? enFrase(valor)
const estado = (valor) => estadosSolicitud[String(valor).toUpperCase()] ?? enFrase(valor)

export function mapearAnalitica(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('La API de analítica no devolvió un tablero')
  }
  const metadata = data.metadata ?? {}
  return {
    mascotasPorEspecie: serie(data.mascotasPorEspecie, 'categoria', 'cantidad', especie),
    mascotasPorFundacion: serie(data.mascotasPorFundacion, 'fundacion', 'cantidad', enTitulo),
    solicitudesPorEstado: serie(data.solicitudesPorEstado, 'categoria', 'cantidad', estado),
    solicitudesPorEspecie: serie(data.solicitudesPorEspecie, 'especie', 'cantidad', especie),
    favoritosPorEspecie: serie(data.favoritosPorEspecie, 'especie', 'cantidad', especie),
    donacionesPorCampana: serie(data.donacionesPorCampana, 'campana', 'total', enTitulo),
    // Registros que quedaron después de la limpieza con pandas.
    procesados: {
      mascotas: Number(metadata.mascotasProcesados) || 0,
      campanas: Number(metadata.campanasProcesados) || 0,
      solicitudes: Number(metadata.solicitudesProcesados) || 0,
      donaciones: Number(metadata.donacionesProcesados) || 0,
      favoritos: Number(metadata.favoritosProcesados) || 0,
    },
  }
}
