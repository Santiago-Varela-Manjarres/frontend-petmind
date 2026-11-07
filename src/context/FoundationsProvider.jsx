import { FoundationsContext } from './FoundationsContext'
import { initialFoundations } from '../data/foundations'
import { usePersistentState } from '../hooks/usePersistentState'
import { initials, slugify } from '../utils/format'

export function FoundationsProvider({ children }) {
  const [foundations, setFoundations] = usePersistentState('foundations', initialFoundations)

  function getFoundationById(id) {
    return foundations.find((foundation) => foundation.id === id)
  }

  // Las fundaciones nuevas quedan "en verificación" y no salen en el directorio hasta que el
  // equipo PetMind las aprueba desde el panel de administración.
  function addFoundation(data) {
    const now = new Date().toISOString()
    const foundation = {
      photo: '/img/fotos/portada-mujer-abrazando-perro.jpg',
      cover: '/img/fotos/portada-mujer-abrazando-perro.jpg',
      animals: [],
      gallery: [],
      transparency: [],
      reviewsList: [],
      color: 'primary',
      map: { x: 50, y: 50 },
      verified: false,
      verification: { status: 'pendiente', date: now },
      stats: { pets: 0, adoptions: 0, campaigns: 0, donations: 0, rating: 0, reviews: 0, stories: 0 },
      ...data,
      id: data.id ?? `${slugify(data.name)}-${Date.now().toString(36)}`,
      initials: initials(data.name),
      since: new Date().getFullYear(),
      createdAt: now,
    }
    setFoundations((prev) => [...prev, foundation])
    return foundation
  }

  function updateFoundation(id, changes) {
    setFoundations((prev) => prev.map((foundation) => (foundation.id === id ? { ...foundation, ...changes } : foundation)))
  }

  // status: pendiente · verificada · rechazada · suspendida (ver data/foundations.js).
  // `verified` se mantiene sincronizado porque el resto del sitio lo usa: la insignia azul,
  // el directorio y la asignación de reportes solo tienen en cuenta fundaciones verificadas.
  function setVerification(id, status, { reason = '', by = null } = {}) {
    updateFoundation(id, {
      verified: status === 'verificada',
      verification: { status, reason, by, date: new Date().toISOString() },
    })
  }

  const value = { foundations, getFoundationById, addFoundation, updateFoundation, setVerification }

  return <FoundationsContext.Provider value={value}>{children}</FoundationsContext.Provider>
}
