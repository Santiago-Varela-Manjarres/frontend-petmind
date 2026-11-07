// Estados de SolicitudAdopcion en el backend → cómo se muestran en el sitio.
export const requestStatus = {
  PENDIENTE: { label: 'Recibida', tone: 'info', text: 'La fundación todavía no la ha abierto.' },
  ENVIADA: { label: 'Recibida', tone: 'info', text: 'La fundación todavía no la ha abierto.' },
  EN_REVISION: { label: 'En revisión', tone: 'neutral', text: 'La fundación está revisando tus datos.' },
  ENTREVISTA: { label: 'Entrevista', tone: 'warning', text: 'La fundación te contactará para una entrevista.' },
  VISITA_HOGAR: { label: 'Visita al hogar', tone: 'primary', text: 'La fundación coordinará una visita a tu hogar.' },
  DOCUMENTOS_PENDIENTES: { label: 'Faltan documentos', tone: 'warning', text: 'La fundación necesita más información para continuar.' },
  APROBADA: { label: 'Aprobada', tone: 'success', text: '¡La fundación aprobó la adopción!' },
  RECHAZADA: { label: 'No aprobada', tone: 'danger', text: 'La fundación no aprobó esta solicitud.' },
  CANCELADA: { label: 'Cancelada', tone: 'neutral', text: 'La solicitud se canceló.' },
  BORRADOR: { label: 'Borrador', tone: 'neutral', text: 'Todavía no se envía.' },
}

export const closedStatuses = ['APROBADA', 'RECHAZADA', 'CANCELADA']

export function statusOf(estado) {
  return requestStatus[estado] ?? { label: estado || 'Sin estado', tone: 'neutral', text: '' }
}

export const housingTypes = [
  { value: 'CASA', label: 'Casa', icon: 'home', description: 'Con o sin patio' },
  { value: 'APARTAMENTO', label: 'Apartamento', icon: 'building', description: 'En edificio o unidad' },
  { value: 'FINCA', label: 'Finca', icon: 'home', description: 'Zona rural' },
  { value: 'HABITACION', label: 'Habitación', icon: 'building', description: 'Cuarto en casa compartida' },
  { value: 'OTRO', label: 'Otro', icon: 'map-pin', description: 'Otro tipo de vivienda' },
]

export function housingLabel(value) {
  return housingTypes.find((item) => item.value === value)?.label ?? value ?? '—'
}

// Las fechas del backend llegan sin zona horaria (LocalDate / LocalDateTime) y se leen como hora local.
// new Date('2026-11-07') la tomaría como medianoche UTC, que en Colombia es el día anterior.
export function apiDate(value) {
  if (!value) return null
  const onlyDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = onlyDate ? new Date(Number(onlyDate[1]), Number(onlyDate[2]) - 1, Number(onlyDate[3])) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatApiDate(value) {
  const date = apiDate(value)
  return date ? date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

const yesNo = (value) => (value == null ? '—' : value ? 'Sí' : 'No')

// Respuestas del formulario (DatosHogar) como filas [etiqueta, valor] para mostrarlas.
export function homeRows(datosHogar) {
  const data = datosHogar ?? {}
  return [
    ['¿Por qué quiere adoptar?', data.motivoAdopcion || '—'],
    ['Vivienda', `${housingLabel(data.tipoVivienda)}${data.esPropietario == null ? '' : data.esPropietario ? ' · propia' : ' · arrendada'}`],
    ['Patio o zona verde', yesNo(data.tienePatio)],
    ['Personas en casa', data.numeroConvivientes ?? '—'],
    ['Otras mascotas', data.tieneOtraMascota ? data.descripcionOtrasMascotas || 'Sí' : yesNo(data.tieneOtraMascota)],
    ['Horas disponibles al día', data.horasDisponiblesDia ?? '—'],
    ['Experiencia con mascotas', data.experienciaPrevia || '—'],
    ['Acepta los compromisos', yesNo(data.aceptaCompromisos)],
  ]
}
