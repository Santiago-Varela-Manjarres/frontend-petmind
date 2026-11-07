import { useEffect, useState } from 'react'
import { AuthContext } from './AuthContext'
import { adminUser, defaultNotificationSettings, initialUsers } from '../data/users'
import { usePersistentState } from '../hooks/usePersistentState'
import { iniciarSesion, registrarPersona } from '../services/usuariosService'
import { obtenerFundacion } from '../services/fundacionesService'

// Los navegadores que ya tenían usuarios guardados antes del panel de administración no traen
// la cuenta del equipo PetMind: se agrega siempre para poder entrar con ella.
function withAdmin(list) {
  return list.some((item) => item.id === adminUser.id) ? list : [...list, adminUser]
}

const SUSPENDED_ERROR ='Tu cuenta está suspendida. Escríbenos a soporte@petmind.co para revisarla.'
const WRONG_CREDENTIALS = 'Correo o contraseña incorrectos'

const accountTypes = { ADOPTANTE: 'persona', REPRESENTANTE_FUNDACION: 'fundacion', ADMIN: 'admin' }

// Las cuentas del backend se guardan también en la lista local (sin contraseña), enlazadas por backendId:
// así el resto del sitio (favoritos, donaciones, panel) las trata igual que a las cuentas de demostración.
function fromApiUser(apiUser, foundation, previous = {}) {
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

// "Recordarme" guarda la sesión en localStorage; si no, en sessionStorage (se borra al cerrar el navegador).
const SESSION_KEY = 'petmind.v1.session'

function readSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSession(session) {
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
    window.localStorage.removeItem(SESSION_KEY)
    if (!session) return
    const storage = session.remember ? window.localStorage : window.sessionStorage
    storage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // almacenamiento bloqueado: la sesión vive solo en memoria
  }
}

export function AuthProvider({ children }) {
  const [storedUsers, setStoredUsers] = usePersistentState('users', initialUsers)
  const [session, setSession] = useState(readSession)
  const [pendingEmail, setPendingEmail] = usePersistentState('pendingEmail', null)
  const [resetEmail, setResetEmail] = usePersistentState('resetEmail', null)

  useEffect(() => {
    writeSession(session)
  }, [session])

  const users = withAdmin(storedUsers)
  const setUsers = (update) => setStoredUsers((prev) => update(withAdmin(prev)))

  // Una cuenta suspendida por el administrador pierde la sesión aunque la tuviera abierta.
  const sessionUser = users.find((item) => item.id === session?.userId) ?? null
  const user = sessionUser?.suspended ? null : sessionUser

  function findByEmail(email = '') {
    const normalized = email.trim().toLowerCase()
    return users.find((item) => item.email.toLowerCase() === normalized)
  }

  // Guarda (o actualiza) la copia local de una cuenta del backend y la devuelve.
  function linkApiUser(apiUser, foundation, extra = {}) {
    const previous = users.find((item) => item.id === `api-${apiUser.id}`)
    const linked = { ...fromApiUser(apiUser, foundation, previous), ...extra }
    setUsers((prev) => [...prev.filter((item) => item.id !== linked.id), linked])
    return linked
  }

  // Primero las cuentas de demostración guardadas en el navegador; si el correo no es de una de ellas,
  // se consulta el backend (POST /auth/login).
  async function login(email, password, remember = true) {
    const found = findByEmail(email)
    let account = found
    if (found && found.source !== 'backend') {
      if (found.password !== password) return { ok: false, error: WRONG_CREDENTIALS }
    } else {
      try {
        const apiUser = await iniciarSesion(email.trim(), password)
        const foundation = apiUser.fundacionId == null ? null : await obtenerFundacion(apiUser.fundacionId).catch(() => null)
        account = linkApiUser(apiUser, foundation)
      } catch (error) {
        return { ok: false, error: error.status === 401 ? WRONG_CREDENTIALS : error.message }
      }
    }
    if (account.suspended) {
      return { ok: false, error: SUSPENDED_ERROR }
    }
    setSession({ userId: account.id, remember })
    return { ok: true, user: account }
  }

  function logout() {
    setSession(null)
  }

  // data trae accountType: 'persona' | 'fundacion' y los campos de cada formulario.
  function register(data) {
    if (findByEmail(data.email)) {
      return { ok: false, error: 'Ya existe una cuenta con este correo' }
    }
    const now = new Date().toISOString()
    const newUser = {
      interests: [],
      avatar: null,
      twoFactor: false,
      notifications: { ...defaultNotificationSettings },
      ...data,
      email: data.email.trim(),
      id: `u-${Date.now()}`,
      emailVerified: false,
      createdAt: now,
      passwordUpdatedAt: now,
    }
    setUsers((prev) => [...prev, newUser])
    setPendingEmail(newUser.email)
    return { ok: true, user: newUser }
  }

  // Las personas se registran en el backend: así pueden enviar solicitudes de adopción reales.
  async function registerPerson(data) {
    if (findByEmail(data.email)) {
      return { ok: false, error: 'Ya existe una cuenta con este correo' }
    }
    try {
      const apiUser = await registrarPersona({ ...data, email: data.email.trim() })
      const linked = linkApiUser(apiUser, null, {
        interests: data.interests ?? [],
        housing: data.housing ?? '',
        city: data.city ?? '',
        emailVerified: false,
      })
      setPendingEmail(linked.email)
      return { ok: true, user: linked }
    } catch (error) {
      return { ok: false, error: error.status === 409 ? 'Ya existe una cuenta con este correo' : error.message }
    }
  }

  function verifyEmail(code) {
    if (!/^\d{6}$/.test(code)) {
      return { ok: false, error: 'Escribe los 6 dígitos del código.' }
    }
    const pending = pendingEmail ? findByEmail(pendingEmail) : null
    if (!pending) {
      return { ok: false, error: 'No encontramos tu registro. Vuelve a crear tu cuenta.' }
    }
    setUsers((prev) => prev.map((item) => (item.id === pending.id ? { ...item, emailVerified: true } : item)))
    setPendingEmail(null)
    setSession({ userId: pending.id, remember: true })
    return { ok: true, user: pending }
  }

  function updateUser(changes) {
    if (!user) return
    setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, ...changes } : item)))
  }

  // Panel de administración: cambia cualquier cuenta (suspender, reactivar, marcar documentos).
  function updateUserById(id, changes) {
    setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }

  function changePassword(current, next) {
    if (user?.source === 'backend') {
      return { ok: false, error: 'Por ahora la contraseña de esta cuenta no se puede cambiar desde aquí.' }
    }
    if (!user || user.password !== current) {
      return { ok: false, error: 'La contraseña actual no coincide.' }
    }
    updateUser({ password: next, passwordUpdatedAt: new Date().toISOString() })
    return { ok: true }
  }

  function deleteAccount() {
    if (!user) return
    setUsers((prev) => prev.filter((item) => item.id !== user.id))
    setSession(null)
  }

  function requestPasswordReset(email) {
    setResetEmail(email.trim())
  }

  function resetPassword(password) {
    const target = resetEmail ? findByEmail(resetEmail) : null
    if (target) {
      setUsers((prev) =>
        prev.map((item) => (item.id === target.id ? { ...item, password, passwordUpdatedAt: new Date().toISOString() } : item)),
      )
    }
    return { ok: true, found: Boolean(target) }
  }

  const value = {
    user,
    users,
    isAuthenticated: Boolean(user),
    isPerson: user?.accountType === 'persona',
    isFoundation: user?.accountType === 'fundacion',
    isAdmin: user?.accountType === 'admin',
    login,
    logout,
    register,
    registerPerson,
    pendingEmail,
    verifyEmail,
    updateUser,
    updateUserById,
    changePassword,
    deleteAccount,
    resetEmail,
    requestPasswordReset,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
