import { useEffect, useState } from 'react'
import { listarSolicitudesDeUsuario } from '../services/solicitudesService'
import { fotosPorMascota, listarArchivos } from '../services/archivosService'

// Solicitudes de adopción que la persona envió por el backend, con la foto de cada mascota.
// Las cuentas de demostración (sin backendId) no tienen solicitudes en el servidor.
export function useSolicitudesDeUsuario(usuarioId) {
  const [state, setState] = useState({ usuarioId: null, status: 'loading', requests: [], photos: new Map() })

  useEffect(() => {
    if (usuarioId == null) return undefined
    let active = true
    Promise.all([listarSolicitudesDeUsuario(usuarioId), listarArchivos().catch(() => [])])
      .then(([requests, archivos]) => {
        if (active) setState({ usuarioId, status: 'success', requests: Array.isArray(requests) ? requests : [], photos: fotosPorMascota(archivos) })
      })
      .catch(() => {
        if (active) setState({ usuarioId, status: 'error', requests: [], photos: new Map() })
      })
    return () => {
      active = false
    }
  }, [usuarioId])

  if (usuarioId == null) return { status: 'idle', requests: [], photos: new Map() }
  return state.usuarioId === usuarioId ? state : { status: 'loading', requests: [], photos: new Map() }
}
