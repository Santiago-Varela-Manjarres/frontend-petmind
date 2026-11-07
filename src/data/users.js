import { daysAgo } from '../utils/dates'

// Usuarios de prueba (contraseña petmind123 para todos).
export const DEMO_PASSWORD = 'petmind123'

// Tipos de cuenta: persona (adopta y dona), fundacion (publica y gestiona) y admin (equipo PetMind).
export const accountTypeLabels = {
  persona: 'Persona',
  fundacion: 'Fundación',
  admin: 'Administrador',
}

export const interestOptions = ['Adoptar', 'Donar', 'Ser hogar de paso', 'Voluntariado', 'Reportar casos']

export const housingOptions = ['Apartamento', 'Casa', 'Finca']

export const defaultNotificationSettings = {
  requests: true,
  campaigns: true,
  alerts: true,
  newsletter: false,
}

// Cuenta del equipo PetMind. No se puede crear desde el registro: solo existe esta de prueba.
// AuthProvider la agrega aunque el navegador tenga guardada una lista de usuarios anterior a ella.
export const adminUser = {
  id: 'u-admin',
  accountType: 'admin',
  name: 'Equipo PetMind',
  lastName: '',
  email: 'admin@petmind.co',
  password: DEMO_PASSWORD,
  phone: '',
  city: 'Medellín',
  emailVerified: true,
  avatar: null,
  notifications: { ...defaultNotificationSettings },
  twoFactor: true,
  passwordUpdatedAt: daysAgo(15),
  createdAt: daysAgo(900),
}

export const initialUsers = [
  {
    id: 'u-brayan',
    accountType: 'persona',
    name: 'Brayan',
    lastName: 'Ciro',
    email: 'brayan.ciro@correo.com',
    password: DEMO_PASSWORD,
    phone: '3001234567',
    city: 'Medellín',
    housing: 'Apartamento',
    interests: ['Adoptar', 'Donar'],
    document: { type: 'CC', number: '1023456482' },
    emailVerified: true,
    homeInfo: true,
    avatar: null,
    notifications: { ...defaultNotificationSettings },
    twoFactor: false,
    passwordUpdatedAt: daysAgo(92),
    alert: { label: 'perros medianos en Medellín', species: 'Perro', size: 'Mediano', city: 'Medellín', lastMatch: daysAgo(1) },
    createdAt: daysAgo(240),
  },
  {
    id: 'u-huellitas',
    accountType: 'fundacion',
    foundationId: 'huellitas-de-amor',
    name: 'Huellitas de Amor',
    lastName: '',
    representative: 'Laura Restrepo',
    email: 'huellitas@correo.com',
    password: DEMO_PASSWORD,
    phone: '6044441234',
    city: 'Medellín',
    nit: '901.234.567-8',
    animals: ['Perros', 'Gatos'],
    emailVerified: true,
    verified: true,
    avatar: null,
    notifications: { ...defaultNotificationSettings },
    twoFactor: true,
    passwordUpdatedAt: daysAgo(30),
    createdAt: daysAgo(900),
  },
  // Fundaciones que se registraron y esperan la verificación del equipo PetMind (ver data/foundations.js).
  {
    id: 'u-huellas-caribe',
    accountType: 'fundacion',
    foundationId: 'huellas-del-caribe',
    name: 'Huellas del Caribe',
    lastName: '',
    representative: 'Andrés Polo',
    email: 'huellasdelcaribe@correo.com',
    password: DEMO_PASSWORD,
    phone: '6053601122',
    city: 'Barranquilla',
    nit: '901.765.432-1',
    animals: ['Perros', 'Gatos'],
    emailVerified: true,
    verified: false,
    avatar: null,
    notifications: { ...defaultNotificationSettings },
    twoFactor: false,
    passwordUpdatedAt: daysAgo(1),
    createdAt: daysAgo(1, 15, 20),
  },
  {
    id: 'u-patas-esperanza',
    accountType: 'fundacion',
    foundationId: 'patas-de-esperanza',
    name: 'Patas de Esperanza',
    lastName: '',
    representative: 'Juliana Arango',
    email: 'patasdeesperanza@correo.com',
    password: DEMO_PASSWORD,
    phone: '6063257788',
    city: 'Pereira',
    nit: '901.588.210-4',
    animals: ['Perros'],
    emailVerified: true,
    verified: false,
    avatar: null,
    notifications: { ...defaultNotificationSettings },
    twoFactor: false,
    passwordUpdatedAt: daysAgo(4),
    createdAt: daysAgo(4, 10, 5),
  },
  {
    id: 'u-gatos-del-eje',
    accountType: 'fundacion',
    foundationId: 'gatos-del-eje',
    name: 'Gatos del Eje',
    lastName: '',
    representative: 'Mateo Cardona',
    email: 'gatosdeleje@correo.com',
    password: DEMO_PASSWORD,
    phone: '6068851234',
    city: 'Manizales',
    nit: '901.432.876-0',
    animals: ['Gatos'],
    emailVerified: true,
    verified: false,
    avatar: null,
    notifications: { ...defaultNotificationSettings },
    twoFactor: false,
    passwordUpdatedAt: daysAgo(9),
    createdAt: daysAgo(9, 9, 40),
  },
  adminUser,
]

export function fullName(user) {
  if (!user) return ''
  return [user.name, user.lastName].filter(Boolean).join(' ')
}
