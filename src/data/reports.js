import { daysAgo, hoursAgo } from '../utils/dates'

export const reportTypes = [
  { value: 'herido', label: 'Animal herido', icon: 'zap' },
  { value: 'abandono', label: 'Abandono', icon: 'home' },
  { value: 'maltrato', label: 'Maltrato', icon: 'shield' },
  { value: 'perdido', label: 'Perdido', icon: 'search' },
]

export const urgencyLevels = [
  { value: 'baja', label: 'Baja', tone: 'success' },
  { value: 'media', label: 'Media', tone: 'warning' },
  { value: 'alta', label: 'Alta', tone: 'danger' },
]

export const emergencyLines = [
  { city: 'Medellín', line: '123 · Línea Amiga de los Animales 604 385 5555' },
  { city: 'Bogotá', line: '123 · IDPYBA 601 647 7117' },
  { city: 'Cali', line: '123 · Bienestar Animal 602 885 4949' },
]

export const initialReports = [
  {
    id: 'RP-40488',
    userId: 'u-brayan',
    type: 'abandono',
    species: 'Perro',
    urgency: 'media',
    address: 'Parque de Laureles, Medellín',
    description: 'Perrita negra amarrada en el parque desde hace dos días, sin agua.',
    photos: [],
    contact: { name: 'Brayan Ciro', phone: '3001234567' },
    anonymous: false,
    status: 'en-camino',
    createdAt: daysAgo(3, 8, 30),
    notified: [
      { foundationId: 'huellitas-de-amor', distance: '1,8 km', status: 'tomado' },
      { foundationId: 'rescate-animal-sur', distance: '6,4 km', status: 'notificada' },
    ],
  },
  {
    id: 'RP-40501',
    userId: null,
    type: 'herido',
    species: 'Perro',
    urgency: 'alta',
    address: 'Calle 10 con Carrera 43, El Poblado',
    description: 'Perro mediano cojeando de la pata delantera.',
    photos: [],
    contact: { name: 'Anónimo', phone: '' },
    anonymous: true,
    status: 'notificado',
    createdAt: hoursAgo(5),
    notified: [{ foundationId: 'huellitas-de-amor', distance: '2,1 km', status: 'notificada' }],
  },
  {
    id: 'RP-40507',
    userId: null,
    type: 'abandono',
    species: 'Gato',
    urgency: 'media',
    address: 'Cra. 70 # 44, Laureles',
    description: 'Gato adulto dejado en una caja frente a una tienda.',
    photos: [],
    contact: { name: 'Natalia Q.', phone: '3015559090' },
    anonymous: false,
    status: 'notificado',
    createdAt: hoursAgo(9),
    notified: [{ foundationId: 'huellitas-de-amor', distance: '4,3 km', status: 'notificada' }],
  },
]

export const reportStatusLabels = {
  notificado: 'Fundaciones notificadas',
  'en-camino': 'Una fundación tomó el caso',
  resuelto: 'Caso resuelto',
  descartado: 'Reporte descartado',
}

// Reportes que todavía necesitan que alguien actúe (el panel de administración los vigila).
export const openReportStatuses = ['notificado', 'en-camino']
