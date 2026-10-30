import { useEffect, useState } from 'react'
import { listarMascotasDisponibles } from '../services/mascotasService'
import { mapearMascota } from '../services/mascotaMapper'

export function useMascotasPublicas() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', pets: [] })

  useEffect(() => {
    let active = true
    listarMascotasDisponibles()
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('La API no devolvió una lista')
        const pets = data.map(mapearMascota)
        if (active) setResult({ status: 'success', pets })
      })
      .catch(() => {
        if (active) setResult({ status: 'error', pets: [] })
      })
    return () => { active = false }
  }, [attempt])

  function retry() {
    setResult({ status: 'loading', pets: [] })
    setAttempt((value) => value + 1)
  }
  return { ...result, retry }
}
