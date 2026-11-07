// Moderación del equipo PetMind (panel de administración).
// Retirar una mascota, campaña o historia la quita del sitio público sin tocar su estado propio
// (Disponible, Activa…): la fundación la sigue viendo en su panel, marcada como "Retirada por PetMind"
// y con el motivo, y no puede volver a publicarla hasta que un administrador la restaure.

export function isHidden(item) {
  return Boolean(item?.moderation?.hidden)
}

// source: 'manual' (retiro puntual) o 'fundacion' (en bloque al rechazar o suspender a la fundación).
// Al reactivar la fundación solo se restauran las publicaciones que se retiraron en bloque.
export function hiddenRecord(reason, by, source = 'manual') {
  return { hidden: true, reason: reason.trim(), by, source, date: new Date().toISOString() }
}
