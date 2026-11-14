import { daysAgo, daysFromNow, isFuture } from '../utils/dates'
import { isHidden } from '../utils/moderation'

const photo = (name) => `/img/fotos/${name}.jpg`

export const campaignCategories = [
  { value: 'Tratamiento', plural: 'Tratamientos', icon: 'syringe', tone: 'accent' },
  { value: 'Rescate', plural: 'Rescates', icon: 'zap', tone: 'primary' },
  { value: 'Alimento', plural: 'Alimento', icon: 'paw', tone: 'warning' },
  { value: 'Esterilización', plural: 'Esterilización', icon: 'shield-check', tone: 'info' },
  { value: 'Refugio', plural: 'Refugios', icon: 'home', tone: 'purple' },
]

export function categoryTone(category) {
  return campaignCategories.find((item) => item.value === category)?.tone ?? 'primary'
}

// Montos sugeridos cuando la campaña no trae los suyos.
export const defaultImpacts = [
  { amount: 20000, label: '1 semana de alimento' },
  { amount: 50000, label: '1 consulta veterinaria' },
  { amount: 100000, label: 'Vacunas para 3 peludos' },
  { amount: 200000, label: '1 esterilización completa' },
]

export const initialCampaigns = [
  {
    id: 'toby',
    title: 'Cirugía de pata para Toby',
    headline: 'Ayudemos a Toby a volver a caminar',
    petName: 'Toby',
    category: 'Tratamiento',
    summary: 'Lo atropellaron en Cali. Necesita cirugía y fisioterapia para volver a caminar.',
    story: [
      'Toby fue atropellado en una vía de Cali y pasó dos días escondido bajo un puente hasta que una vecina nos avisó. Tiene una fractura en la pata trasera izquierda que necesita cirugía con placa, hospitalización y varias semanas de fisioterapia.',
      'Es un perrito joven, noble y muy agradecido. Los veterinarios dicen que, con la cirugía a tiempo, puede recuperar el 100% de su movilidad. Por eso cada día cuenta.',
    ],
    photo: photo('historia-rocky-antes-del-rescate'),
    photoLabel: 'Cuando lo encontramos',
    foundationId: 'patitas-valle',
    location: 'Cali, Valle',
    expenses: [
      { concept: 'Cirugía con placa', amount: 2_800_000 },
      { concept: 'Hospitalización (6 días)', amount: 1_200_000 },
      { concept: 'Medicamentos', amount: 500_000 },
      { concept: 'Fisioterapia (8 sesiones)', amount: 300_000 },
    ],
    raised: 3_620_000,
    donors: 128,
    endDate: daysFromNow(6, 23, 59),
    createdAt: daysAgo(28),
    urgent: true,
    status: 'Activa',
    quoteDocument: 'Cotización de Clínica Veterinaria del Valle verificada por PetMind',
    impacts: [
      { amount: 20000, label: '1 semana de medicamentos', message: 'Toby tiene una semana de medicamentos' },
      { amount: 50000, label: '1 sesión de fisioterapia', message: 'Toby tiene una sesión de fisioterapia' },
      { amount: 100000, label: '1 día de hospitalización', message: 'Toby tiene un día de hospitalización' },
      { amount: 200000, label: 'Radiografías de control', message: 'Toby tiene sus radiografías de control' },
    ],
    updates: [
      { date: daysAgo(16), title: '¡Ya tenemos fecha de cirugía!', text: 'Con lo recaudado apartamos el quirófano. Solo falta completar la hospitalización.' },
      { date: daysAgo(22), title: 'Toby está estable', text: 'Le pusimos una férula temporal y ya come bien. Está en hogar de paso con Marta.', photo: photo('historia-rocky-antes-del-rescate') },
      { date: daysAgo(27), title: 'Lo encontramos', text: 'Una vecina del barrio Siloé nos escribió. Toby estaba débil y no apoyaba la pata.' },
    ],
    receipts: ['Cotización Clínica Veterinaria del Valle.pdf', 'Factura radiografías iniciales.pdf'],
  },
  {
    id: 'esterilizacion-bello',
    title: 'Esterilización de 80 gatos en Bello',
    headline: 'Esterilicemos 80 gatos de la calle en Bello',
    category: 'Esterilización',
    summary: 'Una jornada para esterilizar y vacunar a 80 gatos de dos colonias.',
    story: [
      'En dos colonias de Bello viven más de 80 gatos sin esterilizar. Cada mes nacen nuevas camadas que terminan en la calle.',
      'Con esta jornada esterilizamos, vacunamos y desparasitamos a toda la colonia, y los devolvemos a su lugar con cuidadores del barrio.',
    ],
    photo: photo('mascota-simon-gato'),
    photoLabel: 'Una de las colonias',
    foundationId: 'gatitos-bogota',
    location: 'Bello, Antioquia',
    expenses: [
      { concept: 'Esterilizaciones (80)', amount: 6_400_000 },
      { concept: 'Vacunas y desparasitación', amount: 1_200_000 },
      { concept: 'Transporte y jaulas', amount: 400_000 },
    ],
    raised: 5_100_000,
    donors: 214,
    endDate: daysFromNow(18, 23, 59),
    createdAt: daysAgo(20),
    urgent: false,
    status: 'Activa',
    impacts: [
      { amount: 20000, label: 'Vacuna para 1 gato', message: 'un gato recibe su vacuna' },
      { amount: 50000, label: 'Desparasitar 5 gatos', message: 'cinco gatos quedan desparasitados' },
      { amount: 100000, label: '1 esterilización', message: 'un gato queda esterilizado' },
      { amount: 200000, label: '2 esterilizaciones', message: 'dos gatos quedan esterilizados' },
    ],
    updates: [{ date: daysAgo(6), title: 'Ya vamos por la mitad', text: 'Esterilizamos los primeros 38 gatos. ¡Gracias por compartir!' }],
    receipts: ['Cotización jornada de esterilización.pdf'],
  },
  {
    id: 'alimento-60',
    title: 'Alimento para 60 perritos este mes',
    headline: 'Que a ningún perrito le falte comida este mes',
    category: 'Alimento',
    summary: 'Concentrado para los 60 perros que viven en nuestro refugio.',
    story: [
      'En el refugio de Huellitas de Amor viven 60 perros mientras encuentran hogar. Cada mes necesitamos 900 kilos de concentrado.',
      'Con tu aporte cubrimos el alimento del mes y podemos destinar el resto de los recursos a tratamientos.',
    ],
    photo: photo('mascota-max-perro'),
    photoLabel: 'Max, uno de los 60',
    foundationId: 'huellitas-de-amor',
    location: 'Medellín, Antioquia',
    expenses: [
      { concept: 'Concentrado (900 kg)', amount: 2_600_000 },
      { concept: 'Alimento especial y suplementos', amount: 400_000 },
    ],
    raised: 2_250_000,
    donors: 97,
    endDate: daysFromNow(11, 23, 59),
    createdAt: daysAgo(19),
    urgent: false,
    status: 'Activa',
    impacts: [
      { amount: 20000, label: '1 semana de alimento', message: 'un perrito tiene una semana de alimento' },
      { amount: 50000, label: 'Alimento de 1 mes', message: 'un perrito tiene comida todo el mes' },
      { amount: 100000, label: 'Alimento para 2', message: 'dos perritos tienen comida todo el mes' },
      { amount: 200000, label: 'Alimento para 4', message: 'cuatro perritos tienen comida todo el mes' },
    ],
    updates: [{ date: daysAgo(4), title: 'Llegó el primer bulto', text: 'Ya recibimos 400 kilos de concentrado. ¡Gracias!' }],
    receipts: ['Factura concentrado septiembre.pdf'],
  },
  {
    id: 'rescate-gatitos',
    title: 'Rescate de 12 gatitos en Envigado',
    headline: 'Saquemos a 12 gatitos de una bodega abandonada',
    category: 'Rescate',
    summary: 'Doce gatitos viven en una bodega abandonada que van a demoler.',
    story: [
      'Una bodega abandonada en Envigado será demolida en pocas semanas y adentro viven 12 gatitos con su mamá.',
      'Necesitamos jaulas trampa, transporte y hogares de paso para sacarlos a tiempo y empezar su proceso de adopción.',
    ],
    photo: photo('mascota-milo-gato'),
    photoLabel: 'La bodega',
    foundationId: 'rescate-animal-sur',
    location: 'Envigado, Antioquia',
    expenses: [
      { concept: 'Jaulas trampa y transporte', amount: 700_000 },
      { concept: 'Consulta y vacunas', amount: 1_200_000 },
      { concept: 'Hogar de paso (1 mes)', amount: 600_000 },
    ],
    raised: 980_000,
    donors: 41,
    endDate: daysFromNow(24, 23, 59),
    createdAt: daysAgo(9),
    urgent: false,
    status: 'Activa',
    updates: [],
    receipts: [],
  },
  {
    id: 'cirugia-nala',
    title: 'Cirugía de ojo para Nala',
    headline: 'Salvemos la vista de Nala',
    category: 'Tratamiento',
    summary: 'Nala necesita una cirugía para no perder la vista del ojo derecho.',
    story: [
      'Nala llegó con una infección avanzada en el ojo derecho. El oftalmólogo veterinario recomienda una cirugía lo antes posible.',
      'Con la cirugía y los medicamentos, Nala podrá conservar la vista y estar lista para encontrar un hogar.',
    ],
    photo: photo('mascota-nala-gata'),
    photoLabel: 'Nala en la clínica',
    foundationId: 'huellitas-de-amor',
    location: 'Medellín, Antioquia',
    expenses: [
      { concept: 'Cirugía oftalmológica', amount: 1_300_000 },
      { concept: 'Medicamentos y controles', amount: 500_000 },
    ],
    raised: 1_450_000,
    donors: 63,
    endDate: daysFromNow(4, 23, 59),
    createdAt: daysAgo(12),
    urgent: true,
    status: 'Activa',
    impacts: [
      { amount: 20000, label: 'Gotas para 1 semana', message: 'Nala tiene sus gotas de la semana' },
      { amount: 50000, label: '1 control oftalmológico', message: 'Nala tiene un control con el especialista' },
      { amount: 100000, label: 'Exámenes prequirúrgicos', message: 'Nala tiene sus exámenes antes de la cirugía' },
      { amount: 200000, label: 'Parte de la cirugía', message: 'Nala está más cerca de su cirugía' },
    ],
    updates: [{ date: daysAgo(2), title: 'Exámenes listos', text: 'Nala está lista para la cirugía apenas completemos la meta.' }],
    receipts: ['Cotización cirugía oftalmológica.pdf'],
  },
  {
    id: 'techo-refugio',
    title: 'Techo nuevo para el refugio antes de lluvias',
    headline: 'Un techo seguro para la temporada de lluvias',
    category: 'Refugio',
    summary: 'El techo de los caniles se está cayendo y se vienen las lluvias.',
    story: [
      'El techo de los caniles del refugio tiene más de 10 años y se filtra el agua. Con la temporada de lluvias, los perros pasan las noches mojados.',
      'Queremos cambiar las tejas, reforzar la estructura y poner canales para el agua.',
    ],
    photo: photo('mascota-canela-perra'),
    photoLabel: 'El patio del refugio',
    foundationId: 'rescate-animal-sur',
    location: 'Envigado, Antioquia',
    expenses: [
      { concept: 'Tejas y estructura', amount: 8_500_000 },
      { concept: 'Canales y mano de obra', amount: 3_500_000 },
    ],
    raised: 6_400_000,
    donors: 301,
    endDate: daysFromNow(30, 23, 59),
    createdAt: daysAgo(25),
    urgent: false,
    status: 'Activa',
    updates: [{ date: daysAgo(10), title: 'Compramos las primeras tejas', text: 'Ya cubrimos la mitad del área de caniles.' }],
    receipts: ['Cotización obra.pdf'],
  },
  {
    id: 'vacunacion-cachorros',
    title: 'Vacunación de cachorros',
    headline: 'Vacunas para 40 cachorros rescatados',
    category: 'Tratamiento',
    summary: 'Completemos el esquema de vacunas de dos camadas rescatadas.',
    story: ['En agosto rescatamos dos camadas abandonadas en Bello. Necesitamos completar su esquema de vacunas antes de darlos en adopción.'],
    photo: photo('miniatura-video-nuevo-comienzo-luna'),
    photoLabel: 'Una de las camadas',
    foundationId: 'huellitas-de-amor',
    location: 'Bello, Antioquia',
    expenses: [
      { concept: 'Vacunas (40 × 2 dosis)', amount: 1_600_000 },
      { concept: 'Desparasitación', amount: 250_000 },
      { concept: 'Consulta veterinaria', amount: 150_000 },
    ],
    raised: 440_000,
    donors: 18,
    endDate: daysFromNow(26, 23, 59),
    createdAt: daysAgo(4),
    urgent: false,
    status: 'Activa',
    updates: [],
    receipts: ['cotizacion-vet.pdf'],
  },
  // Enviada por la fundación y pendiente de aprobación en el panel de administración.
  {
    id: 'medicamentos-senior',
    title: 'Medicamentos para perros senior',
    headline: 'Tres meses de tratamiento para 12 abuelitos',
    category: 'Tratamiento',
    summary: 'Doce perros mayores del albergue necesitan medicamentos para la artrosis y el corazón.',
    story: [
      'En el albergue cuidamos 12 perros de más de 10 años. La mayoría tiene artrosis y tres de ellos un soplo en el corazón.',
      'Con esta campaña cubrimos tres meses de medicamentos y los controles con la veterinaria.',
    ],
    photo: photo('mascota-max-perro'),
    photoLabel: 'Uno de los abuelitos del albergue',
    foundationId: 'amigos-de-4-patas',
    location: 'Bello, Antioquia',
    expenses: [
      { concept: 'Antiinflamatorios y condroprotectores (3 meses)', amount: 1_350_000 },
      { concept: 'Medicamentos cardiacos (3 meses)', amount: 720_000 },
      { concept: 'Controles veterinarios', amount: 300_000 },
    ],
    raised: 0,
    donors: 0,
    endDate: daysFromNow(40, 23, 59),
    createdAt: daysAgo(1, 18, 30),
    urgent: false,
    status: 'En revisión',
    updates: [],
    receipts: ['Formula-medica-senior.pdf', 'Cotizacion-farmacia-veterinaria.pdf'],
  },
]

// Estados de una campaña. Las nuevas pasan por "En revisión" hasta que el equipo PetMind las aprueba.
// Equivalencia con EstadoCampana del backend: Borrador → BORRADOR, Activa → ACTIVA, Finalizada → FINALIZADA,
// Rechazada → CANCELADA. "En revisión" todavía no existe en el backend.
export const campaignStatuses = ['Borrador', 'En revisión', 'Activa', 'Rechazada', 'Finalizada']

// Activa y visible en el sitio (aprobada y sin retirar por el equipo PetMind). La fecha de cierre se revisa aparte.
export function isCampaignLive(campaign) {
  return campaign.status === 'Activa' && !isHidden(campaign)
}

// Recibe donaciones: activa, visible y con fecha de cierre por venir (las campañas sin fecha no están abiertas).
export function isCampaignOpen(campaign) {
  return isCampaignLive(campaign) && Boolean(campaign.endDate) && isFuture(campaign.endDate)
}

// "Dona al Fondo PetMind": se reparte entre las campañas que más lo necesitan.
export const fondoPetMind = {
  id: 'fondo-petmind',
  title: 'Fondo PetMind',
  headline: 'Fondo PetMind',
  petName: 'el Fondo PetMind',
  category: 'Fondo',
  summary: 'Lo repartimos cada mes entre las campañas que más lo necesitan.',
  photo: photo('portada-mujer-abrazando-perro'),
  foundationId: null,
  foundationName: 'PetMind',
  location: 'Colombia',
  expenses: [{ concept: 'Campañas urgentes del mes', amount: 10_000_000 }],
  raised: 7_350_000,
  donors: 412,
  endDate: daysFromNow(20, 23, 59),
  urgent: false,
  status: 'Activa',
  impacts: defaultImpacts.map((impact) => ({ ...impact, message: `apoyas ${impact.label.toLowerCase()}` })),
}

export function campaignGoal(campaign) {
  return (campaign?.expenses ?? []).reduce((total, expense) => total + (Number(expense.amount) || 0), 0)
}
