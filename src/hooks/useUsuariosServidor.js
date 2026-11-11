import { useEffect, useState } from 'react'
import { listarFundaciones } from '../services/fundacionesService'
import { listarSolicitudes } from '../services/solicitudesService'
import { fromApiUser } from '../services/usuarioMapper'
import { listarUsuarios } from '../services/usuariosService'

// Cuentas registradas en el backend (GET /usuarios) para el panel de administración, con el nombre de su
// fundación y cuántas solicitudes de adopción envió cada persona. Si fallan las fundaciones o las
// solicitudes, las cuentas se muestran igual, sin esos datos.
export function useUsuariosServidor() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', users: [], requestsByUser: new Map() })

  useEffect(() => {
    let active = true
    Promise.all([listarUsuarios(), listarFundaciones().catch(() => []), listarSolicitudes().catch(() => [])])
      .then(([usuarios, fundaciones, solicitudes]) => {
        if (!Array.isArray(usuarios)) throw new Error('La API no devolvió una lista de usuarios')
        const foundations = new Map((Array.isArray(fundaciones) ? fundaciones : []).map((fundacion) => [fundacion.id, fundacion]))
        const requestsByUser = new Map()
        for (const solicitud of Array.isArray(solicitudes) ? solicitudes : []) {
          if (solicitud.estado === 'BORRADOR') continue
          requestsByUser.set(solicitud.usuarioId, (requestsByUser.get(solicitud.usuarioId) ?? 0) + 1)
        }
        const users = usuarios.map((usuario) => fromApiUser(usuario, foundations.get(usuario.fundacionId) ?? null))
        if (active) setResult({ status: 'success', users, requestsByUser })
      })
      .catch(() => {
        if (active) setResult((prev) => ({ ...prev, status: 'error' }))
      })
    return () => {
      active = false
    }
  }, [attempt])

  function retry() {
    setResult((prev) => ({ ...prev, status: 'loading' }))
    setAttempt((value) => value + 1)
  }

  return { ...result, retry }
}
