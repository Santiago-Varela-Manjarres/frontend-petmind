import { toDateInput } from '../../../utils/dates'

// Valores iniciales, etiquetas y normalizadores compartidos por las secciones del panel de la fundación.

export const newPet = {
  name: '',
  species: 'Perro',
  sex: 'Hembra',
  ageMonths: '12',
  size: 'Mediano',
  city: '',
  photo: '',
  gallery: [],
  status: 'Disponible',
  story: [''],
  traits: [],
  health: { vaccinated: false, dewormed: false, sterilized: false, microchip: false },
  healthNotes: '',
  goodWithKids: null,
  goodWithDogs: null,
  goodWithCats: null,
}

export const newCampaign = {
  title: '',
  headline: '',
  category: 'Tratamiento',
  summary: '',
  photo: '',
  expenses: [{ concept: '', amount: '' }],
  urgent: false,
  endDate: '',
  receipts: [],
  petId: '',
}

export const titles = {
  resumen: 'Panel de fundación',
  mascotas: 'Mis mascotas',
  solicitudes: 'Solicitudes de adopción',
  campanas: 'Mis campañas',
  donaciones: 'Donaciones',
  reportes: 'Reportes cercanos',
  mensajes: 'Mensajes',
  equipo: 'Equipo',
  documentos: 'Documentos',
}

export const statusTone = {
  Disponible: 'success',
  'En proceso': 'warning',
  'Visita agendada': 'info',
  Adoptado: 'neutral',
  Pausado: 'danger',
  Borrador: 'neutral',
  Activa: 'success',
  'En revisión': 'warning',
  Pausada: 'neutral',
}

export const galleryChoices = [
  '/img/fotos/mascota-luna-perra.jpg',
  '/img/fotos/mascota-simon-gato.jpg',
  '/img/fotos/mascota-rocky-perro.jpg',
  '/img/fotos/mascota-nala-gata.jpg',
  '/img/fotos/mascota-max-perro.jpg',
  '/img/fotos/mascota-canela-perra.jpg',
  '/img/fotos/mascota-milo-gato.jpg',
]

// Copia una mascota guardada al formato del formulario (edad como texto, galería y salud completas).
export function normalizePet(pet) {
  return {
    ...newPet,
    ...pet,
    ageMonths: String(pet.ageMonths || 12),
    gallery: pet.gallery?.length ? pet.gallery.map((item) => ({ ...item })) : pet.photo ? [{ src: pet.photo }] : [],
    story: [pet.story?.[0] || ''],
    health: { ...newPet.health, ...pet.health },
  }
}

// Convierte una campaña guardada al formato del formulario (fecha como yyyy-mm-dd y montos como texto).
export function normalizeCampaign(campaign) {
  return {
    ...newCampaign,
    ...campaign,
    endDate: campaign.endDate ? toDateInput(campaign.endDate) : '',
    expenses: campaign.expenses?.length
      ? campaign.expenses.map((item) => ({ ...item, amount: String(item.amount) }))
      : [{ concept: '', amount: '' }],
    receipts: campaign.receipts || [],
  }
}

// Formulario vacío para publicar una mascota nueva (copia nueva para no compartir arreglos).
export function emptyPetForm() {
  return structuredClone(newPet)
}

// Formulario vacío para crear una campaña nueva.
export function emptyCampaignForm() {
  return structuredClone(newCampaign)
}
