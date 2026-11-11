import { defaultNotificationSettings } from '../data/users'

// Rol del backend → tipo de cuenta del frontend.
const accountTypes = { ADOPTANTE: 'persona', REPRESENTANTE_FUNDACION: 'fundacion', ADMIN: 'admin' }

// Las cuentas del backend se guardan también en la lista local (sin contraseña), enlazadas por backendId:
// así el resto del sitio (favoritos, donaciones, panel) las trata igual que a las cuentas de demostración.
// El panel de administración usa la misma forma para listar las cuentas del backend (GET /usuarios).
export function fromApiUser(apiUser, foundation, previous = {}) {
  const now = new Date().toISOString()
  return {
    interests: [],
    avatar: null,
    twoFactor: false,
    notifications: { ...defaultNotificationSettings },
    housing: '',
    emailVerified: true,
    createdAt: apiUser.fechaCreacion ?? now,
    passwordUpdatedAt: now,
    ...previous,
    id: `api-${apiUser.id}`,
    source: 'backend',
    backendId: apiUser.id,
    accountType: accountTypes[apiUser.rol] ?? 'persona',
    name: apiUser.nombre ?? '',
    lastName: apiUser.apellido ?? '',
    email: apiUser.contacto?.emailContacto ?? previous.email ?? '',
    phone: apiUser.contacto?.telefonoPrincipal ?? previous.phone ?? '',
    city: apiUser.direccion?.ciudad ?? previous.city ?? '',
    foundationId: apiUser.fundacionId == null ? null : `api-${apiUser.fundacionId}`,
    backendFoundationId: apiUser.fundacionId ?? null,
    foundationName: foundation?.nombre ?? previous.foundationName ?? null,
    foundationVerified: foundation ? foundation.estadoVerificacion === 'VERIFICADA' : previous.foundationVerified ?? false,
  }
}
