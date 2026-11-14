// Avisos (toast) después de guardar en el servidor, para el panel de la fundación y el de administración.
// Devuelven los argumentos de showToast: showToast(...avisoMascotaGuardada(...)).
// Si lo principal se guardó pero falló algo secundario (fotos, gastos o portada), el aviso sale en rojo y
// dura más, para que la persona alcance a leer qué debe corregir.

const EXITO = { tone: 'success' }
const INCOMPLETO = { tone: 'error', duration: 7000 }

export function avisoMascotaGuardada(mensaje, { fotosGuardadas }) {
  return fotosGuardadas ? [mensaje, EXITO] : [`${mensaje} No pudimos guardar todas las fotos: edítala para intentarlo de nuevo.`, INCOMPLETO]
}

export function avisoCampanaPublicada(campana, { gastosGuardados, portadaGuardada }, mensaje) {
  const faltas = [!gastosGuardados && 'los gastos', !portadaGuardada && 'la foto de portada'].filter(Boolean)
  return faltas.length ? [`Publicamos “${campana.titulo}”, pero no pudimos guardar ${faltas.join(' ni ')}.`, INCOMPLETO] : [mensaje, EXITO]
}
