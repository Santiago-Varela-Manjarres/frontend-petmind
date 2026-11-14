import { useEffect, useState } from 'react'
import { listarFundaciones } from '../services/fundacionesService'

// Fundaciones registradas en el backend (FundacionResponse), ordenadas por nombre.
// Las usan los formularios del administrador (elegir la fundación), las tablas (nombre) y el formulario
// de una mascota nueva (ciudad de la fundación). enabled = false: no consulta nada (status "idle").
export function useFundacionesApi({ enabled = true } = {}) {
  const [state, setState] = useState({ attempt: -1, status: 'loading', fundaciones: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    listarFundaciones()
      .then((lista) => {
        const fundaciones = (Array.isArray(lista) ? lista : [])
          .filter((fundacion) => fundacion.estadoActivo !== false)
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        if (active) setState({ attempt, status: 'success', fundaciones })
      })
      .catch(() => {
        if (active) setState({ attempt, status: 'error', fundaciones: [] })
      })
    return () => {
      active = false
    }
  }, [enabled, attempt])

  const retry = () => setAttempt((value) => value + 1)
  if (!enabled) return { status: 'idle', fundaciones: [], porId: () => null, retry }
  const current = state.attempt === attempt ? state : { status: 'loading', fundaciones: state.fundaciones }
  return {
    ...current,
    porId: (id) => current.fundaciones.find((fundacion) => fundacion.id === Number(id)) ?? null,
    retry,
  }
}
