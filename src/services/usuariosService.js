import { apiGet, apiSend } from './api'

// Cuentas activas registradas en el backend (las usa el panel de administración).
export function listarUsuarios() {
  return apiGet('/usuarios')
}

export function iniciarSesion(correo, contrasena) {
  return apiSend('POST', '/auth/login', { correo, contrasena })
}

// Registro de personas (rol ADOPTANTE). El backend valida la misma regla de contraseña que el frontend.
export function registrarPersona({ name, lastName, email, phone, city, password }) {
  return apiSend('POST', '/usuarios', {
    nombre: name,
    apellido: lastName,
    contrasena: password,
    contacto: { emailContacto: email, telefonoPrincipal: phone || null },
    direccion: city ? { ciudad: city, pais: 'Colombia' } : null,
    rol: 'ADOPTANTE',
  })
}
