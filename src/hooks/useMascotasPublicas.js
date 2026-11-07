import { useEffect, useState } from 'react'
import { listarMascotasDisponibles } from '../services/mascotasService'
import { listarArchivos, fotosPorMascota } from '../services/archivosService'
import { mapearMascota } from '../services/mascotaMapper'

export function useMascotasPublicas() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ status: 'loading', pets: [] })

  useEffect(() => {
    let active = true
    // Las fotos se piden en una sola consulta; si fallan, las mascotas se muestran sin foto.
    Promise.all([listarMascotasDisponibles(), listarArchivos().catch(() => [])])
      .then(([data, archivos]) => {
        if (!Array.isArray(data)) throw new Error('La API no devolvió una lista')
        const fotos = fotosPorMascota(archivos)
        const pets = data.map((mascota) => {
          const pet = mapearMascota(mascota)
          return { ...pet, photo: fotos.get(pet.id) ?? null }
        })
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
