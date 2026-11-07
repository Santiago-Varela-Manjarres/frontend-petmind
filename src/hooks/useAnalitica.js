import { useEffect, useState } from 'react'
import { mapearAnalitica } from '../services/analiticaMapper'
import { obtenerAnalitica } from '../services/analiticaService'

// En el plan gratuito de Render la API de Python se apaga sin uso: la primera consulta puede fallar
// (502) o tardar cerca de un minuto mientras arranca. Por eso se reintenta sola unas veces antes de
// mostrar el error.
export const MAX_INTENTOS = 5
const ESPERA_ENTRE_INTENTOS = 15_000

// Último tablero recibido: al volver a la pantalla se muestra de inmediato mientras se actualiza.
let ultimoTablero = null

export function useAnalitica() {
  const [consulta, setConsulta] = useState(0)
  const [estado, setEstado] = useState(() => ({
    datos: ultimoTablero?.datos ?? null,
    actualizado: ultimoTablero?.actualizado ?? null,
    cargando: true,
    error: null,
    intento: 1,
  }))

  useEffect(() => {
    let activo = true
    let temporizador

    function consultar(intento) {
      obtenerAnalitica()
        .then(mapearAnalitica)
        .then((datos) => {
          ultimoTablero = { datos, actualizado: new Date().toISOString() }
          if (activo) setEstado({ ...ultimoTablero, cargando: false, error: null, intento })
        })
        .catch((error) => {
          if (!activo) return
          // Sin URL configurada no tiene sentido esperar a que el servicio despierte.
          const reintentar = intento < MAX_INTENTOS && !String(error?.message).includes('VITE_API_URL')
          if (reintentar) {
            setEstado((prev) => ({ ...prev, intento: intento + 1 }))
            temporizador = window.setTimeout(() => consultar(intento + 1), ESPERA_ENTRE_INTENTOS)
          } else {
            setEstado((prev) => ({ ...prev, cargando: false, error: error?.message || 'Error desconocido' }))
          }
        })
    }

    consultar(1)
    return () => {
      activo = false
      window.clearTimeout(temporizador)
    }
  }, [consulta])

  function actualizar() {
    setEstado((prev) => ({ ...prev, cargando: true, error: null, intento: 1 }))
    setConsulta((valor) => valor + 1)
  }

  return { ...estado, actualizar }
}
