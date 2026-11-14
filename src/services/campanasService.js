import { apiGet, apiSend } from './api'
import { fotosPorCampana, fotosPorMascota, listarArchivos } from './archivosService'
import { listarFundaciones } from './fundacionesService'
import { listarMascotas } from './mascotasService'
import { mapearCampana } from './campanaMapper'

// Campañas de donación del backend y sus gastos (la meta es la suma de los gastos, como en el editor).
// PUT /campanas-donacion/{id} deja el monto recaudado en cero, así que por ahora las campañas no se editan.

export function listarCampanas() {
  return apiGet('/campanas-donacion')
}

// Todas las campañas del backend ya convertidas a la forma del sitio, con su fundación, la mascota,
// la portada (si no tiene, la foto de la mascota) y los gastos. Lo que no sea la lista de campañas es
// opcional: si falla, la campaña se muestra igual sin ese dato.
export async function cargarCampanasDelBackend() {
  const opcional = (promesa) => promesa.catch(() => [])
  const [campanas, archivos, fundaciones, mascotas, gastos] = await Promise.all([
    listarCampanas(),
    opcional(listarArchivos()),
    opcional(listarFundaciones()),
    opcional(listarMascotas()),
    opcional(listarGastos()),
  ])
  if (!Array.isArray(campanas)) throw new Error('La API no devolvió una lista de campañas')
  const portadas = fotosPorCampana(archivos)
  const fotosMascotas = fotosPorMascota(archivos)
  const porId = (lista) => new Map((Array.isArray(lista) ? lista : []).map((item) => [item.id, item]))
  const fundacionPorId = porId(fundaciones)
  const mascotaPorId = porId(mascotas)
  const listaGastos = Array.isArray(gastos) ? gastos.filter((gasto) => gasto.estadoActivo !== false) : []
  return campanas.map((campana) =>
    mapearCampana(campana, {
      fundacion: fundacionPorId.get(campana.fundacionId),
      mascota: mascotaPorId.get(campana.mascotaId),
      foto: portadas.get(String(campana.id)) ?? (campana.mascotaId == null ? null : fotosMascotas.get(String(campana.mascotaId))),
      gastos: listaGastos.filter((gasto) => gasto.campanaId === campana.id),
    }),
  )
}

export function crearCampana(datos) {
  return apiSend('POST', '/campanas-donacion', datos)
}

export function listarGastos() {
  return apiGet('/gastos-campana')
}

export function crearGasto({ campanaId, concepto, monto, orden }) {
  return apiSend('POST', '/gastos-campana', { campanaId, concepto, monto, orden })
}
