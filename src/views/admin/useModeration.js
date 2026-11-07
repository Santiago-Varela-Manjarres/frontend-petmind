import { useAdminLog } from '../../context/AdminLogContext'
import { useAuth } from '../../context/AuthContext'
import { useCampaigns } from '../../context/CampaignsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { useReports } from '../../context/ReportsContext'
import { useStories } from '../../context/StoriesContext'
import { useToast } from '../../context/ToastContext'
import { fullName } from '../../data/users'
import { hiddenRecord, isHidden } from '../../utils/moderation'

// Acciones del panel de administración. Cada una cambia los datos en su contexto, deja constancia en la
// bitácora (quién, qué y por qué) y avisa con un toast. Cuando el backend tenga estos endpoints, este es
// el archivo que pasa a llamar a la API; las pantallas no cambian.
export function useModeration() {
  const { user, users, updateUserById } = useAuth()
  const { setVerification } = useFoundations()
  const { pets, updatePet } = usePets()
  const { campaigns, updateCampaign } = useCampaigns()
  const { moderateStory } = useStories()
  const { updateReport } = useReports()
  const { record } = useAdminLog()
  const { showToast } = useToast()
  const by = fullName(user)

  function log(action, tone, target, reason = '') {
    record({ by, action, tone, target, reason })
  }

  const foundationTarget = (foundation) => ({ type: 'fundacion', id: foundation.id, name: foundation.name })

  // Lo que la fundación tiene a la vista del público y se retira en bloque al rechazarla o suspenderla:
  // mascotas que no son borrador y campañas activas.
  function publicItemsOf(foundationId) {
    return {
      pets: pets.filter((pet) => pet.foundationId === foundationId && !isHidden(pet) && pet.status !== 'Borrador'),
      campaigns: campaigns.filter(
        (campaign) => campaign.foundationId === foundationId && !isHidden(campaign) && campaign.status === 'Activa',
      ),
    }
  }

  function hideFoundationItems(foundationId, reason) {
    const items = publicItemsOf(foundationId)
    const moderation = hiddenRecord(reason, by, 'fundacion')
    items.pets.forEach((pet) => updatePet(pet.id, { moderation }))
    items.campaigns.forEach((campaign) => updateCampaign(campaign.id, { moderation }))
    return items.pets.length + items.campaigns.length
  }

  // Solo vuelve lo que se retiró en bloque con la fundación; un retiro puntual se revisa aparte.
  function restoreFoundationItems(foundationId) {
    const fromFoundation = (item) => item.foundationId === foundationId && item.moderation?.source === 'fundacion'
    const hiddenPets = pets.filter(fromFoundation)
    const hiddenCampaigns = campaigns.filter(fromFoundation)
    hiddenPets.forEach((pet) => updatePet(pet.id, { moderation: null }))
    hiddenCampaigns.forEach((campaign) => updateCampaign(campaign.id, { moderation: null }))
    return hiddenPets.length + hiddenCampaigns.length
  }

  // La cuenta de la fundación también guarda `verified` y los documentos subidos desde su panel.
  function updateRepresentatives(foundationId, verified) {
    users
      .filter((item) => item.foundationId === foundationId)
      .forEach((representative) =>
        updateUserById(representative.id, {
          verified,
          ...(verified && representative.documents
            ? {
                documents: representative.documents.map((doc) =>
                  doc.status === 'Pendiente de revisión' ? { ...doc, status: 'Verificado' } : doc,
                ),
              }
            : {}),
        }),
      )
  }

  const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

  return {
    publicItemsOf,

    // Fundaciones ------------------------------------------------------------------------------------
    approveFoundation(foundation, previousStatus) {
      setVerification(foundation.id, 'verificada', { by })
      updateRepresentatives(foundation.id, true)
      const restored = restoreFoundationItems(foundation.id)
      const reactivated = previousStatus === 'suspendida'
      log(reactivated ? 'Reactivó la fundación' : 'Verificó la fundación', 'success', foundationTarget(foundation))
      showToast(
        `${foundation.name} ${reactivated ? 'volvió al sitio' : 'ya es una fundación verificada'}` +
          (restored ? ` y recuperó ${plural(restored, 'publicación')}.` : '.'),
      )
    },

    rejectFoundation(foundation, reason, hideItems) {
      setVerification(foundation.id, 'rechazada', { reason, by })
      updateRepresentatives(foundation.id, false)
      const hidden = hideItems ? hideFoundationItems(foundation.id, `La fundación no superó la verificación: ${reason}`) : 0
      log('Rechazó la verificación', 'danger', foundationTarget(foundation), reason)
      showToast(`Rechazamos la verificación de ${foundation.name}${hidden ? ` y retiramos ${plural(hidden, 'publicación')}` : ''}.`, {
        tone: 'info',
      })
    },

    suspendFoundation(foundation, reason, hideItems) {
      setVerification(foundation.id, 'suspendida', { reason, by })
      updateRepresentatives(foundation.id, false)
      const hidden = hideItems ? hideFoundationItems(foundation.id, `Fundación suspendida: ${reason}`) : 0
      log('Suspendió la fundación', 'danger', foundationTarget(foundation), reason)
      showToast(`Suspendimos a ${foundation.name}${hidden ? ` y retiramos ${plural(hidden, 'publicación')}` : ''}.`, {
        tone: 'info',
      })
    },

    // Mascotas ---------------------------------------------------------------------------------------
    hidePet(pet, reason) {
      updatePet(pet.id, { moderation: hiddenRecord(reason, by) })
      log('Retiró la publicación', 'danger', { type: 'mascota', id: pet.id, name: pet.name }, reason)
      showToast(`Retiramos la publicación de ${pet.name}.`, { tone: 'info' })
    },

    restorePet(pet) {
      updatePet(pet.id, { moderation: null })
      log('Restauró la publicación', 'success', { type: 'mascota', id: pet.id, name: pet.name })
      showToast(`${pet.name} vuelve a estar visible en PetMind.`)
    },

    // Campañas ---------------------------------------------------------------------------------------
    approveCampaign(campaign) {
      updateCampaign(campaign.id, { status: 'Activa', review: { status: 'aprobada', by, date: new Date().toISOString() } })
      log('Aprobó la campaña', 'success', { type: 'campana', id: campaign.id, name: campaign.title })
      showToast(`“${campaign.title}” ya recibe donaciones.`)
    },

    rejectCampaign(campaign, reason) {
      updateCampaign(campaign.id, {
        status: 'Rechazada',
        review: { status: 'rechazada', reason, by, date: new Date().toISOString() },
      })
      log('Rechazó la campaña', 'danger', { type: 'campana', id: campaign.id, name: campaign.title }, reason)
      showToast(`Devolvimos “${campaign.title}” a la fundación con tus observaciones.`, { tone: 'info' })
    },

    hideCampaign(campaign, reason) {
      updateCampaign(campaign.id, { moderation: hiddenRecord(reason, by) })
      log('Retiró la campaña', 'danger', { type: 'campana', id: campaign.id, name: campaign.title }, reason)
      showToast(`Retiramos “${campaign.title}” del sitio.`, { tone: 'info' })
    },

    restoreCampaign(campaign) {
      updateCampaign(campaign.id, { moderation: null })
      log('Restauró la campaña', 'success', { type: 'campana', id: campaign.id, name: campaign.title })
      showToast(`“${campaign.title}” vuelve a estar visible.`)
    },

    finishCampaign(campaign) {
      updateCampaign(campaign.id, { status: 'Finalizada' })
      log('Finalizó la campaña', 'neutral', { type: 'campana', id: campaign.id, name: campaign.title })
      showToast(`Cerramos “${campaign.title}”. Ya no recibe donaciones.`, { tone: 'info' })
    },

    // Historias --------------------------------------------------------------------------------------
    hideStory(story, reason) {
      moderateStory(story.id, hiddenRecord(reason, by))
      log('Retiró la historia', 'danger', { type: 'historia', id: story.id, name: story.title }, reason)
      showToast(`Retiramos “${story.title}”.`, { tone: 'info' })
    },

    restoreStory(story) {
      moderateStory(story.id, null)
      log('Restauró la historia', 'success', { type: 'historia', id: story.id, name: story.title })
      showToast(`“${story.title}” vuelve a estar publicada.`)
    },

    // Reportes de animales ---------------------------------------------------------------------------
    notifyFoundation(report, foundation) {
      updateReport(report.id, {
        notified: [...(report.notified ?? []), { foundationId: foundation.id, distance: 'Asignada por PetMind', status: 'notificada' }],
      })
      log(`Notificó a ${foundation.name}`, 'info', { type: 'reporte', id: report.id, name: report.id })
      showToast(`Notificamos el caso ${report.id} a ${foundation.name}.`)
    },

    resolveReport(report) {
      updateReport(report.id, { status: 'resuelto', closed: { by, date: new Date().toISOString() } })
      log('Cerró el reporte como resuelto', 'success', { type: 'reporte', id: report.id, name: report.id })
      showToast(`Marcamos el caso ${report.id} como resuelto.`)
    },

    discardReport(report, reason) {
      updateReport(report.id, { status: 'descartado', closed: { by, reason, date: new Date().toISOString() } })
      log('Descartó el reporte', 'neutral', { type: 'reporte', id: report.id, name: report.id }, reason)
      showToast(`Descartamos el reporte ${report.id}.`, { tone: 'info' })
    },

    reopenReport(report) {
      const taken = report.notified?.some((item) => item.status === 'tomado')
      updateReport(report.id, { status: taken ? 'en-camino' : 'notificado', closed: null })
      log('Reabrió el reporte', 'warning', { type: 'reporte', id: report.id, name: report.id })
      showToast(`El caso ${report.id} vuelve a estar abierto.`)
    },

    // Usuarios ---------------------------------------------------------------------------------------
    suspendUser(account, reason) {
      updateUserById(account.id, { suspended: true, suspension: { reason, by, date: new Date().toISOString() } })
      log('Suspendió la cuenta', 'danger', { type: 'usuario', id: account.id, name: fullName(account) || account.email }, reason)
      showToast(`Suspendimos la cuenta de ${fullName(account) || account.email}.`, { tone: 'info' })
    },

    reactivateUser(account) {
      updateUserById(account.id, { suspended: false, suspension: null })
      log('Reactivó la cuenta', 'success', { type: 'usuario', id: account.id, name: fullName(account) || account.email })
      showToast(`La cuenta de ${fullName(account) || account.email} vuelve a estar activa.`)
    },
  }
}
