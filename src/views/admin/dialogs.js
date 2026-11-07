import { plural } from '../../utils/format'

// Textos de la ventana de confirmación para cada decisión sobre una fundación. Los usan la tabla de
// fundaciones y el detalle. kind: verificar · rechazar · suspender. moderation = useModeration().
export function foundationDialog(kind, foundation, status, moderation) {
  if (kind === 'verificar') {
    const reactivating = status === 'suspendida'
    return {
      icon: 'shield-check',
      title: reactivating ? `Reactivar a ${foundation.name}` : `Verificar a ${foundation.name}`,
      text: reactivating
        ? 'Vuelve al directorio con la insignia de fundación verificada y recupera las publicaciones que se retiraron con la suspensión.'
        : 'Aparecerá en el directorio con la insignia azul de fundación verificada y empezará a recibir reportes de animales cercanos.',
      confirmLabel: reactivating ? 'Reactivar fundación' : 'Verificar fundación',
      onConfirm: () => moderation.approveFoundation(foundation, status),
    }
  }

  // Al rechazar o suspender se ofrece retirar lo que la fundación tiene publicado.
  const items = moderation.publicItemsOf(foundation.id)
  const count = items.pets.length + items.campaigns.length
  const option = count
    ? {
        label: count === 1 ? 'Retirar también su publicación del sitio' : `Retirar también sus ${count} publicaciones del sitio`,
        hint: `${plural(items.pets.length, 'mascota')} y ${plural(items.campaigns.length, 'campaña activa', 'campañas activas')}. Vuelven solas si la fundación se verifica de nuevo.`,
        defaultChecked: true,
      }
    : undefined

  if (kind === 'rechazar') {
    return {
      icon: 'alert-triangle',
      tone: 'danger',
      title: `Rechazar la verificación de ${foundation.name}`,
      text: 'La fundación verá el motivo en su panel y podrá corregir sus datos o documentos para pedir una nueva revisión.',
      reasonLabel: 'Motivo del rechazo',
      reasonPlaceholder: 'Ej.: El NIT del RUT no coincide con el registrado. Sube un RUT actualizado.',
      confirmLabel: 'Rechazar verificación',
      option,
      onConfirm: ({ reason, option: hideItems }) => moderation.rejectFoundation(foundation, reason, hideItems),
    }
  }

  return {
    icon: 'alert-triangle',
    tone: 'danger',
    title: `Suspender a ${foundation.name}`,
    text: 'Sale del directorio y pierde la insignia de verificada. La fundación verá el motivo en su panel.',
    reasonLabel: 'Motivo de la suspensión',
    reasonPlaceholder: 'Ej.: Recibimos denuncias de cobros a adoptantes. Suspendemos el perfil mientras lo revisamos.',
    confirmLabel: 'Suspender fundación',
    option,
    onConfirm: ({ reason, option: hideItems }) => moderation.suspendFoundation(foundation, reason, hideItems),
  }
}
