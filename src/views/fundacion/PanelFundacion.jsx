import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { useAdoptions } from '../../context/AdoptionsContext'
import { useAuth } from '../../context/AuthContext'
import { useCampaigns } from '../../context/CampaignsContext'
import { useDonations } from '../../context/DonationsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { useToast } from '../../context/ToastContext'
import { finishedStages } from '../../data/adoptions'
import { fromDateInput, isFuture } from '../../utils/dates'
import CampaignEditor from './panel/CampaignEditor'
import CampaignsList from './panel/CampaignsList'
import DashboardSummary from './panel/DashboardSummary'
import DocumentsPanel from './panel/DocumentsPanel'
import DonationsPanel from './panel/DonationsPanel'
import MessagesPanel from './panel/MessagesPanel'
import PetEditor from './panel/PetEditor'
import PetsList from './panel/PetsList'
import ReportsPanel from './panel/ReportsPanel'
import RequestsSection from './panel/RequestsSection'
import TeamPanel from './panel/TeamPanel'
import { emptyCampaignForm, emptyPetForm, normalizeCampaign, normalizePet, titles } from './panel/panelData'
import styles from './Fundacion.module.css'

// 08 · Panel de la fundación. Todas las rutas /fundacion/* usan este componente;
// la sección se toma de la URL y cada una vive en su propio archivo dentro de ./panel.
export default function PanelFundacion() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { petId, campaignId, id: requestId } = useParams()
  const section = pathname.split('/')[2] || 'resumen'
  const isNew = pathname.endsWith('/nueva')
  const { user, updateUser } = useAuth()
  const { getFoundationById } = useFoundations()
  const foundation = getFoundationById(user.foundationId)
  const { pets, addPet, updatePet } = usePets()
  const { requests } = useAdoptions()
  const { campaigns, addCampaign, updateCampaign } = useCampaigns()
  const { donations } = useDonations()
  const { showToast } = useToast()

  const ownPets = pets.filter((pet) => pet.foundationId === user.foundationId)
  const ownRequests = requests.filter((request) => request.foundationId === user.foundationId)
  const ownCampaigns = campaigns.filter((campaign) => campaign.foundationId === user.foundationId)
  const ownDonations = donations.filter((donation) =>
    ownCampaigns.some((campaign) => campaign.id === donation.campaignId),
  )
  const activeCampaigns = ownCampaigns.filter((campaign) => campaign.status === 'Activa')
  const latest = ownRequests
    .filter((request) => !finishedStages.includes(request.stage) && request.stage !== 'borrador')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const title = titles[section] || titles.resumen
  // Quién firma los mensajes y quién aparece en el historial de cada solicitud.
  const author = foundation?.representative || user.name
  const movedBy = foundation?.representative || user.representative || 'Laura R.'

  const currentPet = ownPets.find((pet) => pet.id === petId)
  const currentCampaign = ownCampaigns.find((campaign) => campaign.id === campaignId)

  // Los formularios guardan solo lo que la persona ha editado; mientras sea null se usa la ficha guardada
  // (o un formulario vacío). React reutiliza este componente entre rutas /fundacion/*, así que al cambiar
  // de ruta se descartan los cambios: sin esto, editar a Max mostraba los datos que se acababan de
  // guardar de Luna y "Guardar" sobrescribía a Luna.
  const [petForm, setPetForm] = useState(null)
  const [campaignForm, setCampaignForm] = useState(null)
  const [formPath, setFormPath] = useState(pathname)
  if (formPath !== pathname) {
    setFormPath(pathname)
    setPetForm(null)
    setCampaignForm(null)
  }
  const petDraft = petForm ?? (currentPet ? normalizePet(currentPet) : emptyPetForm())
  const campaignDraft = campaignForm ?? (currentCampaign ? normalizeCampaign(currentCampaign) : emptyCampaignForm())

  function editPet(next) {
    setPetForm((current) => (typeof next === 'function' ? next(current ?? petDraft) : next))
  }

  function editCampaign(next) {
    setCampaignForm((current) => (typeof next === 'function' ? next(current ?? campaignDraft) : next))
  }

  function persistPet(status) {
    const form = petDraft
    const gallery = (form.gallery || []).filter((item) => item.src)
    const story = String(form.story?.[0] || '').trim()
    const missing = []
    if (gallery.length < 3) missing.push('agrega al menos 3 fotos')
    if (!form.name.trim() || !form.city.trim() || !form.ageMonths) missing.push('completa los datos básicos')
    if (!Object.values(form.health || {}).some(Boolean)) missing.push('registra la información de salud')
    if (story.length < 100) missing.push('escribe una historia de al menos 100 caracteres')
    if (status === 'Disponible' && missing.length) {
      showToast(`Para publicar, ${missing.join(', ')}.`, { tone: 'error' })
      return
    }
    const data = {
      ...form,
      foundationId: user.foundationId,
      status,
      ageMonths: Number(form.ageMonths) || 12,
      city: form.city.trim(),
      photo: gallery[0]?.src || form.photo,
      gallery,
      story: [story],
      traits: form.traits || [],
      health: form.health || {},
    }
    if (form.id) updatePet(form.id, data)
    else addPet(data)
    navigate('/fundacion/mascotas')
    showToast(
      status === 'Borrador'
        ? 'Guardamos el borrador de la mascota.'
        : form.id
          ? 'Actualizamos la ficha de la mascota.'
          : 'Publicamos la mascota.',
      { tone: 'success' },
    )
  }

  function persistCampaign(status) {
    const form = campaignDraft
    const goal = (form.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const validExpenses = (form.expenses || []).some((expense) => expense.concept.trim() && Number(expense.amount) > 0)
    const errors = []
    if (!form.title.trim()) errors.push('escribe el título')
    if (!form.summary.trim()) errors.push('cuenta la historia')
    if (!validExpenses) errors.push('agrega un gasto válido')
    if (!form.endDate || !isFuture(fromDateInput(form.endDate))) errors.push('elige una fecha futura')
    if (status === 'Activa' && errors.length) {
      showToast(`Revisa la campaña: ${errors.join(', ')}.`, { tone: 'error' })
      return
    }
    const pet = ownPets.find((item) => item.id === form.petId)
    const data = {
      ...form,
      foundationId: user.foundationId,
      location: `${foundation?.city || user.city}, Colombia`,
      photo: form.photo || pet?.photo || '',
      expenses: form.expenses
        .filter((expense) => expense.concept.trim() || Number(expense.amount) > 0)
        .map((expense) => ({ ...expense, amount: Number(expense.amount) || 0 })),
      goal,
      story: [form.summary.trim()],
      status,
    }
    if (form.id) updateCampaign(form.id, data)
    else addCampaign({ ...data, raised: 0, donors: 0 })
    navigate(status === 'Activa' && !form.id ? '/donar' : '/fundacion/campanas')
    showToast(
      status === 'Borrador'
        ? 'Guardamos el borrador de la campaña.'
        : !form.id
          ? 'PetMind aprobó tu campaña (simulado).'
          : 'Actualizamos la campaña.',
      { tone: 'success' },
    )
  }

  const newRequests = latest.filter((item) => ['nueva', 'revision'].includes(item.stage)).length
  const upcomingInterviews = latest.filter(
    (item) => item.stage === 'entrevista' && new Date(item.interview?.date) >= new Date(),
  ).length

  return (
    <main className={styles.page}>
      <title>{`${title} | PetMind`}</title>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow">
            {section === 'resumen' ? 'Buen trabajo este mes' : foundation?.name || 'Tu organización'}
          </span>
          <h1>{section === 'resumen' ? `Hola, equipo de ${foundation?.name || 'tu fundación'}` : title}</h1>
          <p>
            {section === 'resumen'
              ? `Tienes ${newRequests} solicitudes nuevas y ${upcomingInterviews} entrevistas esta semana.`
              : section === 'mascotas'
                ? 'Administra las mascotas publicadas por la fundación.'
                : 'Gestiona desde aquí el cuidado y los procesos de tu fundación.'}
          </p>
        </div>
        {section === 'resumen' ? (
          <div className={styles.toolbar}>
            <Link className="btn btn-secondary" to="/fundacion/campanas/nueva">
              <Icon name="heart" />
              Crear campaña
            </Link>
            <Link className="btn btn-primary" to="/fundacion/mascotas/nueva">
              <Icon name="plus" />
              Publicar mascota
            </Link>
          </div>
        ) : section === 'mascotas' && !petId && !isNew ? (
          <Link className="btn btn-primary" to="/fundacion/mascotas/nueva">
            <Icon name="plus" />
            Publicar mascota
          </Link>
        ) : section === 'campanas' && !campaignId && !isNew ? (
          <Link className="btn btn-primary" to="/fundacion/campanas/nueva">
            <Icon name="plus" />
            Crear campaña
          </Link>
        ) : null}
      </header>

      {section === 'resumen' && (
        <DashboardSummary
          foundation={foundation}
          ownRequests={ownRequests}
          ownPets={ownPets}
          activeCampaigns={activeCampaigns}
          latest={latest}
        />
      )}

      {section === 'mascotas' &&
        (petId || isNew ? (
          <PetEditor
            key={petId || 'nueva'}
            value={petDraft}
            setValue={editPet}
            foundation={foundation}
            onSave={persistPet}
            onCancel={() => navigate('/fundacion/mascotas')}
          />
        ) : (
          <PetsList ownPets={ownPets} ownRequests={ownRequests} showToast={showToast} />
        ))}

      {section === 'solicitudes' && (
        <RequestsSection
          ownPets={ownPets}
          ownRequests={ownRequests}
          requestId={requestId}
          foundation={foundation}
          author={author}
          movedBy={movedBy}
          showToast={showToast}
        />
      )}

      {section === 'campanas' &&
        (campaignId || isNew ? (
          <CampaignEditor
            key={campaignId || 'nueva'}
            value={campaignDraft}
            setValue={editCampaign}
            ownPets={ownPets}
            onSave={persistCampaign}
            onCancel={() => navigate('/fundacion/campanas')}
          />
        ) : (
          <CampaignsList ownCampaigns={ownCampaigns} />
        ))}

      {section === 'donaciones' && (
        <DonationsPanel
          donations={ownDonations.filter((item) => item.status === 'aprobada')}
          campaigns={ownCampaigns}
        />
      )}
      {section === 'reportes' && <ReportsPanel foundationId={user.foundationId} showToast={showToast} />}
      {section === 'mensajes' && <MessagesPanel ownRequests={ownRequests} ownPets={ownPets} />}
      {section === 'equipo' && (
        <TeamPanel
          team={
            user.team || [
              { name: foundation?.representative || 'Laura Restrepo', email: user.email, role: 'Representante legal' },
              { name: 'Marta Gómez', email: 'marta@huellitas.org', role: 'Voluntaria' },
            ]
          }
          persist={(next) => updateUser({ team: next })}
          showToast={showToast}
        />
      )}
      {section === 'documentos' && <DocumentsPanel user={user} updateUser={updateUser} showToast={showToast} />}
    </main>
  )
}
