import { useEffect, useState } from 'react'

// Guarda el estado en localStorage para que la demo sobreviva a un F5.
// Si los datos llevan más de 3 días sin usarse se vuelve a los de prueba
// (sus fechas son relativas a hoy). Para reiniciar: borrar las llaves "petmind.v1.*".
const PREFIX = 'petmind.v1.'
const MAX_AGE = 3 * 24 * 60 * 60 * 1000

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    const saved = JSON.parse(raw)
    if (!saved || typeof saved.savedAt !== 'number' || Date.now() - saved.savedAt > MAX_AGE) return fallback
    // Datos viejos o editados a mano con otra forma (p. ej. un objeto donde se espera una lista)
    // romperían las pantallas que hacen .map o .find: en ese caso se vuelve a los datos de prueba.
    if (saved.data === undefined || Array.isArray(saved.data) !== Array.isArray(fallback)) return fallback
    return saved.data
  } catch {
    return fallback
  }
}

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    const fallback = typeof initialValue === 'function' ? initialValue() : initialValue
    return read(key, fallback)
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), data: state }))
    } catch {
      // Sin espacio (fotos muy pesadas) o almacenamiento bloqueado: la demo sigue en memoria.
    }
  }, [key, state])

  return [state, setState]
}

export function clearPersistentState() {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
    window.sessionStorage.removeItem(`${PREFIX}session`)
  } catch {
    // nada que limpiar
  }
}
