import { daysAgo } from '../utils/dates'

// Bitácora del panel de administración. Cada decisión guarda quién la tomó, sobre qué y por qué.
// target.type: fundacion · mascota · campana · historia · reporte · usuario
// tone: color del punto en la lista (success · danger · warning · info · neutral)
export const initialAdminLog = [
  {
    id: 'log-gatos-del-eje',
    date: daysAgo(7, 11, 15),
    by: 'Equipo PetMind',
    action: 'Rechazó la verificación',
    tone: 'danger',
    target: { type: 'fundacion', id: 'gatos-del-eje', name: 'Gatos del Eje' },
    reason: 'El certificado de Cámara de comercio es de 2019. Necesitamos uno expedido en los últimos 30 días.',
  },
]
