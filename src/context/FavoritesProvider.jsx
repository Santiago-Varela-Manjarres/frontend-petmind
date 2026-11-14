import { useEffect, useState } from 'react'
import { FavoritesContext } from './FavoritesContext'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { usePersistentState } from '../hooks/usePersistentState'
import { crearFavorito, eliminarFavorito, listarFavoritosDeUsuario } from '../services/favoritosService'

const empty = { pets: [], campaigns: [], foundations: [] }
const noServerItems = { pets: [], campaigns: [] }
const PENDING = 'pendiente'

// Favoritos por usuario: { [userId]: { pets, campaigns, foundations } }
const initialFavorites = {
  'u-brayan': {
    pets: ['luna', 'nala', 'canela', 'max', 'thor'],
    campaigns: ['toby', 'cirugia-nala'],
    foundations: ['huellitas-de-amor'],
  },
}

// GET /favoritos/por-usuario → { pets: [{ id, favoritoId }], campaigns: [...] }, del más reciente al más antiguo.
// Los ids son los del sitio: "65" para la mascota 65 y "api-17" para la campaña 17.
function fromServer(list) {
  const items = { pets: [], campaigns: [] }
  const active = (Array.isArray(list) ? list : [])
    .filter((favorite) => favorite.estadoActivo !== false)
    .sort((a, b) => String(b.fechaCreacion ?? '').localeCompare(String(a.fechaCreacion ?? '')) || b.id - a.id)
  for (const favorite of active) {
    if (favorite.mascotaId != null) items.pets.push({ id: String(favorite.mascotaId), favoritoId: favorite.id })
    else if (favorite.campanaId != null) items.campaigns.push({ id: `api-${favorite.campanaId}`, favoritoId: favorite.id })
  }
  return items
}

const unique = (list) => [...new Set(list)]

// Las cuentas del backend guardan en el servidor (POST/DELETE /favoritos) las mascotas y campañas del backend,
// así se ven desde cualquier equipo y cuentan en las estadísticas. Lo demás (cuentas de demostración, mascotas
// y campañas de demostración, fundaciones) se guarda en este navegador, como antes.
export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [favoritesByUser, setFavoritesByUser] = usePersistentState('favorites', initialFavorites)
  const backendUserId = user?.source === 'backend' ? user.backendId : null
  const [server, setServer] = useState({ userId: null, status: 'loading', items: noServerItems })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (backendUserId == null) return undefined
    let active = true
    listarFavoritosDeUsuario(backendUserId)
      .then((list) => {
        if (active) setServer({ userId: backendUserId, status: 'success', items: fromServer(list) })
      })
      .catch(() => {
        if (active) setServer({ userId: backendUserId, status: 'error', items: noServerItems })
      })
    return () => {
      active = false
    }
  }, [backendUserId, attempt])

  const serverReady = backendUserId != null && server.userId === backendUserId
  const serverItems = serverReady ? server.items : noServerItems
  const status = backendUserId == null ? 'success' : serverReady ? server.status : 'loading'
  const local = (user && favoritesByUser[user.id]) || empty
  const favorites = {
    pets: unique([...serverItems.pets.map((item) => item.id), ...local.pets]),
    campaigns: unique([...serverItems.campaigns.map((item) => item.id), ...local.campaigns]),
    foundations: local.foundations,
  }

  function isFavorite(type, id) {
    return favorites[type].includes(id)
  }

  // Después de un error, "Reintentar" vuelve a mostrar "Cargando…" mientras llega la respuesta.
  function reloadFavorites() {
    setServer((prev) => (prev.status === 'error' ? { ...prev, status: 'loading' } : prev))
    setAttempt((value) => value + 1)
  }

  // Cambia solo la lista del usuario que la pidió (si cerró sesión en medio de la petición, no toca nada).
  function patchServer(userId, type, change) {
    setServer((prev) => (prev.userId === userId ? { ...prev, items: { ...prev.items, [type]: change(prev.items[type]) } } : prev))
  }

  // El corazón cambia al instante y, si el servidor falla, vuelve a como estaba.
  async function toggleOnServer(type, id, targetId, current) {
    const userId = backendUserId
    if (current) {
      patchServer(userId, type, (list) => list.filter((item) => item.id !== id))
      try {
        await eliminarFavorito(current.favoritoId)
      } catch (error) {
        patchServer(userId, type, (list) => [current, ...list.filter((item) => item.id !== id)])
        showToast(`No pudimos quitarlo de tus favoritos. ${error.message}`, { tone: 'error' })
      }
      return
    }
    patchServer(userId, type, (list) => [{ id, favoritoId: PENDING }, ...list])
    try {
      const created = await crearFavorito({
        usuarioId: userId,
        mascotaId: type === 'pets' ? targetId : null,
        campanaId: type === 'campaigns' ? targetId : null,
      })
      patchServer(userId, type, (list) => list.map((item) => (item.id === id ? { id, favoritoId: created.id } : item)))
    } catch (error) {
      if (error.status === 409) {
        await confirmSaved(userId, type, id)
        return
      }
      patchServer(userId, type, (list) => list.filter((item) => item.id !== id))
      showToast(`No pudimos guardar tu favorito. ${error.message}`, { tone: 'error' })
    }
  }

  // 409: ya estaba guardado (por ejemplo, desde otro equipo). Solo se busca su id en el servidor para poder
  // quitarlo después; el resto de la lista no se toca, así no se pierde otro favorito que se esté guardando.
  async function confirmSaved(userId, type, id) {
    try {
      const saved = fromServer(await listarFavoritosDeUsuario(userId))[type].find((item) => item.id === id)
      patchServer(userId, type, (list) => (saved ? list.map((item) => (item.id === id ? saved : item)) : list.filter((item) => item.id !== id)))
    } catch (error) {
      patchServer(userId, type, (list) => list.filter((item) => item.id !== id))
      showToast(`No pudimos confirmar tu favorito. ${error.message}`, { tone: 'error' })
    }
  }

  // Devuelve false si no hay sesión (la página manda a iniciar sesión), null si no se pudo hacer nada
  // todavía (ya se avisó con un mensaje) y true si se guardó o se quitó.
  // options.backendId: id de la mascota o campaña en el backend; sin él, el favorito se guarda en el navegador.
  function toggleFavorite(type, id, { backendId: targetId = null } = {}) {
    if (!user) return false
    if (backendUserId != null && targetId != null && (type === 'pets' || type === 'campaigns')) {
      if (!serverReady || server.status !== 'success') {
        showToast(
          server.status === 'error' && serverReady
            ? 'No pudimos cargar tus favoritos. Recarga la página e inténtalo de nuevo.'
            : 'Estamos cargando tus favoritos. Inténtalo en un momento.',
          { tone: server.status === 'error' && serverReady ? 'error' : 'info' },
        )
        return null
      }
      const current = serverItems[type].find((item) => item.id === id)
      if (current?.favoritoId === PENDING) {
        showToast('Un momento: estamos guardando tu favorito.', { tone: 'info' })
        return null
      }
      toggleOnServer(type, id, targetId, current)
      return true
    }
    setFavoritesByUser((prev) => {
      const current = prev[user.id] ?? empty
      const list = current[type].includes(id) ? current[type].filter((item) => item !== id) : [id, ...current[type]]
      return { ...prev, [user.id]: { ...current, [type]: list } }
    })
    return true
  }

  const value = { favorites, isFavorite, toggleFavorite, favoritesStatus: status, reloadFavorites }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
