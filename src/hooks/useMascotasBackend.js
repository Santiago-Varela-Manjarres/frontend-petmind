import { useEffect, useState } from 'react'
import { listarMascotas, listarMascotasDeFundacion } from '../services/mascotasService'
import { fotosPorMascota, listarArchivos } from '../services/archivosService'
import { mapearMascota } from '../services/mascotaMapper'

// Mascotas activas del backend en cualquier estado (también adoptadas, en borrador o pausadas), con su foto.
// fundacionId: solo las de esa fundación. enabled = false: no consulta nada (status "idle").
// Cada mascota trae `raw` (la respuesta del backend) para las tablas de los paneles.
export function useMascotasBackend({ fundacionId = null, enabled = true } = {}) {
  const [state, setState] = useState({ key: null, scope: null, status: 'loading', pets: [] })
  const [attempt, setAttempt] = useState(0)
  const scope = fundacionId ?? 'todas'
  const key = enabled ? `${scope}-${attempt}` : null

  useEffect(() => {
    if (!key) return undefined
    let active = true
    const lista = fundacionId == null ? listarMascotas() : listarMascotasDeFundacion(fundacionId)
    Promise.all([lista, listarArchivos().catch(() => [])])
      .then(([data, archivos]) => {
        if (!Array.isArray(data)) throw new Error('La API no devolvió una lista')
        const fotos = fotosPorMascota(archivos)
        const pets = data.flatMap((mascota) => {
          try {
            const pet = mapearMascota(mascota)
            return [{ ...pet, photo: fotos.get(pet.id) ?? null, raw: mascota }]
          } catch {
            return []
          }
        })
        if (active) setState({ key, scope, status: 'success', pets })
      })
      .catch(() => {
        if (active) setState({ key, scope, status: 'error', pets: [] })
      })
    return () => {
      active = false
    }
  }, [key, scope, fundacionId])

  const reload = () => setAttempt((value) => value + 1)
  if (!key) return { status: 'idle', pets: [], reload }
  if (state.key === key) return { status: state.status, pets: state.pets, reload }
  // Al recargar la misma lista se conserva la anterior mientras llega la nueva (la tabla no parpadea).
  if (state.scope === scope && state.pets.length) return { status: 'success', pets: state.pets, reload }
  return { status: 'loading', pets: [], reload }
}
