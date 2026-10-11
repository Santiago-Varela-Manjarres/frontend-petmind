import { startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Cierra la sesión y lleva al inicio.
// React Router aplica la navegación como transición: si el cierre de sesión se aplica antes,
// <RequireAuth> ve "sin usuario" en la ruta privada y manda a /login. Al hacer las dos cosas
// dentro de la misma transición, React las pinta juntas y la persona llega al inicio.
export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return function logoutAndGoHome() {
    startTransition(() => {
      logout()
      navigate('/')
    })
  }
}
