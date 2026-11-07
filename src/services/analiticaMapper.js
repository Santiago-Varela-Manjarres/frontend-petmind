// Adapta la respuesta de la API de analítica (Python) a lo que pintan las gráficas.
// Cada colección de Python nombra distinto la etiqueta (categoria, especie, fundacion, campana) y el valor
// (cantidad, total); aquí todas quedan como { label, value }. Python pasa los textos a minúsculas y las
// categorías a MAYÚSCULAS, así que también se dejan legibles ("EN_REVISION" → "En revisión").

const especies = { PERRO: 'Perro', GATO: 'Gato', OTRO: 'Otro' }

// Valores de EstadoSolicitud en el backend, en el orden del proceso (así se dibujan las columnas).
const estadosSolicitud = [
  ['BORRADOR', 'Borrador'],
  ['ENVIADA', 'Enviada'],
  ['PENDIENTE', 'Pendiente'],
  ['EN_REVISION', 'En revisión'],
  ['DOCUMENTOS_PENDIENTES', 'Faltan documentos'],
  ['ENTREVISTA', 'Entrevista'],
  ['VISITA_HOGAR', 'Visita al hogar'],
  ['APROBADA', 'Aprobada'],
  ['RECHAZADA', 'Rechazada'],
  ['CANCELADA', 'Cancelada'],
]

// EstadoAdopcion de las mascotas. El orden fija el color de cada parte de la dona (slot 1 a 4),
// así un estado conserva su color aunque otro desaparezca.
const estadosAdopcion = [
  ['DISPONIBLE', 'Disponible'],
  ['EN_PROCESO', 'En proceso'],
  ['ADOPTADO', 'Adoptado'],
  ['EN_TRATAMIENTO', 'En tratamiento'],
]

const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

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

// Serie de categorías con un orden conocido (estados): se ordena así y cada fila lleva su posición
// (slot) en ese orden. Un valor nuevo que no esté en la lista va al final y sin slot.
function serieOrdenada(lista, campoEtiqueta, campoValor, orden) {
  const posicion = new Map(orden.map(([clave], indice) => [clave, indice]))
  const nombres = new Map(orden)
  return serie(lista, campoEtiqueta, campoValor, (valor) => String(valor).toUpperCase())
    .map((fila) => ({
      label: nombres.get(fila.label) ?? enFrase(fila.label),
      value: fila.value,
      slot: posicion.has(fila.label) ? posicion.get(fila.label) + 1 : null,
    }))
    .sort((a, b) => (a.slot ?? Infinity) - (b.slot ?? Infinity))
}

// Semanas (lunes) con su cantidad. Se conservan las semanas en cero: son parte de la serie de tiempo.
function semanas(lista) {
  if (!Array.isArray(lista)) return []
  return lista
    .map((item) => {
      const [anio, mes, dia] = String(item?.semana ?? '').split('-').map(Number)
      if (!anio || !mes || !dia) return null
      const corto = `${dia} ${meses[mes - 1]}`
      return { label: `Semana del ${corto}`, short: corto, value: Number(item?.cantidad) || 0 }
    })
    .filter(Boolean)
}

export function mapearAnalitica(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('La API de analítica no devolvió un tablero')
  }
  const metadata = data.metadata ?? {}
  return {
    mascotasPorEspecie: serie(data.mascotasPorEspecie, 'categoria', 'cantidad', especie),
    mascotasPorEstadoAdopcion: serieOrdenada(data.mascotasPorEstadoAdopcion, 'categoria', 'cantidad', estadosAdopcion),
    mascotasPorSemana: semanas(data.mascotasPorSemana),
    mascotasPorFundacion: serie(data.mascotasPorFundacion, 'fundacion', 'cantidad', enTitulo),
    solicitudesPorEstado: serieOrdenada(data.solicitudesPorEstado, 'categoria', 'cantidad', estadosSolicitud),
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
