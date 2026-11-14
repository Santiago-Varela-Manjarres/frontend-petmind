import { initials } from '../utils/format'
import { apiDate } from './solicitudMapper'

// Campañas de donación del backend ↔ forma de las campañas del sitio (tarjetas, detalle y flujo de donar).

// `publica` es la categoría con la que se filtra en Donar (las mismas de las campañas de demostración).
export const categoriasCampana = [
  { value: 'SALUD', label: 'Salud', icon: 'syringe', publica: 'Tratamiento' },
  { value: 'CIRUGIA', label: 'Cirugía', icon: 'heart', publica: 'Tratamiento' },
  { value: 'ALIMENTACION', label: 'Alimentación', icon: 'paw', publica: 'Alimento' },
  { value: 'RESCATE', label: 'Rescate', icon: 'zap', publica: 'Rescate' },
  { value: 'REFUGIO', label: 'Refugio', icon: 'home', publica: 'Refugio' },
  { value: 'ADOPCION', label: 'Adopción', icon: 'users', publica: 'Adopción' },
  { value: 'OTRA', label: 'Otra', icon: 'sparkles', publica: 'Otras' },
]

const estados = { ACTIVA: 'Activa', BORRADOR: 'Borrador', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada' }

export function categoriaDe(valor) {
  return categoriasCampana.find((item) => item.value === valor) ?? categoriasCampana.at(-1)
}

// Solo "api-<número>": una campaña de demostración cuyo título empieza por "API" también tiene un id "api-…".
export const esCampanaApi = (id) => /^api-\d+$/.test(String(id ?? ''))

// Los gastos explican la meta. Si no suman lo mismo (campañas creadas sin gastos), se completa con el resto.
function gastosDe(meta, gastos) {
  const lista = [...gastos]
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id)
    .map((gasto) => ({ concept: gasto.concepto, amount: Number(gasto.monto) || 0 }))
  const suma = lista.reduce((total, gasto) => total + gasto.amount, 0)
  if (!lista.length || suma > meta) return [{ concept: 'Meta de la campaña', amount: meta }]
  if (meta - suma >= 1) lista.push({ concept: 'Otros gastos de la campaña', amount: meta - suma })
  return lista
}

// fundacion: FundacionResponse · mascota: MascotaResponse · foto: URL de la portada · gastos: GastoCampanaResponse[]
export function mapearCampana(campana, { fundacion = null, mascota = null, foto = null, gastos = [] } = {}) {
  const meta = Number(campana.metaMonto) || 0
  const fin = apiDate(campana.fechaFin)
  const inicio = apiDate(campana.fechaInicio)
  const categoria = categoriaDe(campana.categoria)
  const ciudad = fundacion?.direccion?.ciudad
  return {
    id: `api-${campana.id}`,
    backendId: campana.id,
    source: 'backend',
    // Igual que user.foundationId de los representantes: así la fundación dueña ve sus campañas sin publicar.
    foundationId: campana.fundacionId == null ? null : `api-${campana.fundacionId}`,
    backendFoundationId: campana.fundacionId,
    // Las fundaciones del backend no tienen perfil público en el sitio: la tarjeta usa estos datos.
    foundation: fundacion
      ? {
          id: null,
          name: fundacion.nombre,
          initials: initials(fundacion.nombre),
          color: 'primary',
          verified: fundacion.estadoVerificacion === 'VERIFICADA',
        }
      : null,
    backendPetId: campana.mascotaId,
    petName: mascota?.nombre,
    title: campana.titulo,
    summary: campana.descripcion,
    story: [campana.descripcion].filter(Boolean),
    category: categoria.publica,
    categoryLabel: categoria.label,
    backendCategory: campana.categoria,
    expenses: gastosDe(meta, gastos),
    raised: Number(campana.montoRecaudado) || 0,
    donors: 0,
    // Cierra al final del día de fechaFin (hora local), como las campañas creadas en el sitio.
    endDate: fin ? new Date(fin.getFullYear(), fin.getMonth(), fin.getDate(), 23, 59).toISOString() : null,
    createdAt: campana.fechaCreacion ?? inicio?.toISOString() ?? null,
    urgent: Boolean(campana.esUrgente),
    status: estados[campana.estado] ?? campana.estado,
    photo: foto ?? '',
    location: ciudad ? `${ciudad}, Colombia` : 'Colombia',
    updates: [],
    receipts: [],
  }
}
