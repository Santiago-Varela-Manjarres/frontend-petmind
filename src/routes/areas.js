// Panel privado de cada tipo de cuenta. Lo usan el inicio de sesión, <RequireAuth> y la barra de navegación.
export const accountHome = {
  persona: '/cuenta',
  fundacion: '/fundacion',
  admin: '/admin',
}

export function homeFor(accountType) {
  return accountHome[accountType] ?? '/'
}

// ¿La ruta es del panel de otro tipo de cuenta? Después de iniciar sesión no se vuelve allí
// (una fundación que entró desde /cuenta/... va a su propio panel).
export function isOtherAccountArea(path, accountType) {
  return Object.entries(accountHome).some(
    ([type, base]) => type !== accountType && (path === base || path.startsWith(`${base}/`)),
  )
}
