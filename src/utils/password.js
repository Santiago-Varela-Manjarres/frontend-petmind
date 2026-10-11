// Regla de contraseña de PetMind: mínimo 8 caracteres, al menos una mayúscula y al menos un
// carácter especial. Es la misma regla que valida el backend (UsuarioServiceImpl), así que si
// cambia aquí también hay que cambiarla allá.
export const passwordRules = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (value) => value.length >= 8 },
  { id: 'upper', label: 'Una mayúscula', test: (value) => /[A-ZÁÉÍÓÚÜÑ]/.test(value) },
  // Carácter especial: cualquier cosa que no sea letra, número o espacio (!, @, #, $, …).
  { id: 'symbol', label: 'Un carácter especial (!@#$)', test: (value) => /[^\p{L}\p{N}\s]/u.test(value) },
]

export const PASSWORD_ERROR = 'Usa mínimo 8 caracteres, una mayúscula y un carácter especial.'

// Cuántas reglas cumple la contraseña (0 a 3). Lo usa la barra de seguridad.
export function passwordScore(value = '') {
  if (!value) return 0
  return passwordRules.filter((rule) => rule.test(value)).length
}

// true solo si cumple todas las reglas. Úsala en todos los formularios que crean o cambian contraseñas.
export function isValidPassword(value = '') {
  return passwordRules.every((rule) => rule.test(value))
}
