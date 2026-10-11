import { createContext, useContext } from 'react'

// Crea un contexto y su hook de lectura. El hook avisa con un error claro si se usa
// fuera de su Provider, en lugar de devolver null y fallar más adelante.
// Ejemplo: export const [PetsContext, usePets] = createRequiredContext('usePets', 'PetsProvider')
export function createRequiredContext(hookName, providerName) {
  const Context = createContext(null)

  function useRequiredContext() {
    const value = useContext(Context)
    if (!value) {
      throw new Error(`${hookName} debe usarse dentro de ${providerName}`)
    }
    return value
  }

  return [Context, useRequiredContext]
}
