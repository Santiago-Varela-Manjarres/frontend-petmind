import { useEffect, useState } from 'react'
import { obtenerFundacion } from '../services/fundacionesService'

// Fundación de una mascota del backend. Si la consulta falla, la página se muestra sin ese dato.
export function useDatosMascotaPublica(fundacionId) {
  const [datos, setDatos] = useState({ fundacionId: null, fundacion: null })

  useEffect(() => {
    if (!fundacionId) return undefined
    let active = true
    obtenerFundacion(fundacionId)
      .then((fundacion) => { if (active) setDatos({ fundacionId, fundacion }) })
      .catch(() => { if (active) setDatos({ fundacionId, fundacion: null }) })
    return () => { active = false }
  }, [fundacionId])

  // Evita mostrar la fundación de la mascota anterior mientras carga la nueva.
  return { fundacion: datos.fundacionId === fundacionId ? datos.fundacion : null }
}
