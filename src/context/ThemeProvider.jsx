import { useEffect, useState } from 'react'
import { ThemeContext } from './ThemeContext'
import './ThemeProvider.css'

const THEME_KEY = 'petmind-theme'

// localStorage puede lanzar error (modo privado de Safari, cookies bloqueadas, iframes).
// Sin el try/catch la app quedaba en blanco al arrancar en esos navegadores.
function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  } catch {
    // Sin acceso al almacenamiento: se usa la preferencia del sistema.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      // No se pudo guardar: el tema vale solo para esta visita.
    }
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}