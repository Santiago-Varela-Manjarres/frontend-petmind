import { useState } from 'react'
import { Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { Isotipo } from '../../components/ui/Logo'
import { VerifiedBadge } from '../../components/ui/Badges'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Stepper } from '../../components/forms/Steppers'
import NoEncontrada from '../NoEncontrada'
import { useCampaigns } from '../../context/CampaignsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { useAuth } from '../../context/AuthContext'
import { campaignGoal, defaultImpacts, isCampaignLive } from '../../data/campaigns'
import { PLATFORM_FEE_RATE } from '../../data/donations'
import { daysUntil, isFuture } from '../../utils/dates'
import { formatCOP, onlyDigits, percent } from '../../utils/format'
import styles from './DonarFlujo.module.css'

function initialDraft(user, params, impacts) {
  const amountParam = Number(params.get('monto'))
  const preset = impacts.some((impact) => impact.amount === amountParam)
  return {
    frequency: params.get('frecuencia') === 'mensual' ? 'mensual' : 'unica',
    amount: preset ? amountParam : amountParam ? null : 50000,
    custom: amountParam && !preset ? String(amountParam) : '',
    coverFee: true,
    anonymous: false,
    message: '',
    name: user?.accountType === 'persona' ? user.name : '',
    lastName: user?.accountType === 'persona' ? user.lastName : '',
    docType: user?.document?.type ?? 'CC',
    docNumber: user?.document?.number ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    company: false,
    companyName: '',
    companyNit: '',
    updates: true,
    showName: false,
    method: 'tarjeta',
    stepOneDone: false,
    stepTwoDone: false,
  }
}

// 03 · Donaciones / 03 a 05 · Donar en 3 pasos. Guarda el estado del flujo y pinta el resumen de la derecha.
export default function DonarFlujo() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const { getCampaignById } = useCampaigns()
  const { getFoundationById } = useFoundations()
  const { getPetById } = usePets()
  const { user } = useAuth()

  const campaign = getCampaignById(id)
  const impacts = (campaign?.impacts ?? defaultImpacts).slice(0, 4)
  const [draft, setDraft] = useState(() => initialDraft(user, params, impacts))

  if (!campaign) return <NoEncontrada title="No encontramos esta campaña" backTo="/donar" backLabel="Ver campañas" />
  // Solo se dona a campañas aprobadas por PetMind, sin retirar y sin vencer. El Fondo PetMind siempre recibe.
  if (campaign.id !== 'fondo-petmind' && !(isCampaignLive(campaign) && isFuture(campaign.endDate))) {
    return (
      <NoEncontrada
        title="Esta campaña no está recibiendo donaciones"
        text="Puede que ya haya cerrado o que todavía esté en revisión. Mira las campañas activas."
        backTo="/donar"
        backLabel="Ver campañas"
      />
    )
  }

  const isFund = campaign.id === 'fondo-petmind'
  const sponsoredPet = isFund ? getPetById(params.get('para')) : null
  const foundation = getFoundationById(campaign.foundationId)
  const goal = campaignGoal(campaign)
  const pct = percent(campaign.raised, goal)
  const amount = draft.custom ? Number(onlyDigits(draft.custom)) : (draft.amount ?? 0)
  const fee = draft.coverFee ? Math.round(amount * PLATFORM_FEE_RATE) : 0
  const total = amount + fee
  const monthly = draft.frequency === 'mensual'
  const beneficiary = sponsoredPet?.name ?? campaign.petName ?? 'la campaña'

  const step = pathname.endsWith('/pago') ? 3 : pathname.endsWith('/datos') ? 2 : 1

  function update(changes) {
    setDraft((prev) => ({ ...prev, ...changes }))
  }

  const context = { campaign, foundation, impacts, draft, update, amount, fee, total, monthly, isFund, sponsoredPet, beneficiary }

  return (
    <div className={styles.flow}>
      <title>{`Donar a ${beneficiary === 'la campaña' ? campaign.title : beneficiary} | PetMind`}</title>
      <Stepper steps={['Monto', 'Tus datos', 'Pago']} current={step} tone="accent" className={styles.stepper} />

      <div className={styles.layout}>
        <div className={`panel ${styles.card}`}>
          <Outlet context={context} />
        </div>

        <aside className={styles.aside}>
          <div className={styles.campaign}>
            <div className={styles.campaignPhoto}>
              <img src={sponsoredPet?.photo ?? campaign.photo} alt="" />
              {campaign.urgent && <span className="badge badge-accent">Urgente</span>}
            </div>
            <div className={styles.campaignBody}>
              <h2>{sponsoredPet ? `Apadrina a ${sponsoredPet.name}` : campaign.title}</h2>
              <p className={styles.campaignFoundation}>
                {foundation ? (
                  <>
                    <Avatar initials={foundation.initials} color={foundation.color} size="xs" shape="rounded" />
                    {foundation.name}
                    {foundation.verified && <VerifiedBadge size="sm" />}
                  </>
                ) : (
                  <>
                    <Isotipo className={styles.fundLogo} />
                    {sponsoredPet ? 'Fondo PetMind · cuidado de mascotas' : 'Fondo PetMind'}
                  </>
                )}
              </p>
              <ProgressBar value={pct} label={`${pct}% recaudado`} />
              <p className={styles.campaignNumbers}>
                <span>
                  {formatCOP(campaign.raised)} de {formatCOP(goal)}
                </span>
                <span>{isFund ? 'este mes' : `${daysUntil(campaign.endDate)} días`}</span>
              </p>
            </div>
          </div>

          <div className={`panel panel-sm ${styles.summary}`}>
            <h2>Resumen de tu donación</h2>
            <dl>
              <div>
                <dt>Donación ({monthly ? 'mensual' : 'única'})</dt>
                <dd>{formatCOP(amount)}</dd>
              </div>
              {draft.coverFee && (
                <div>
                  <dt>Cubrir costos de la plataforma</dt>
                  <dd>{formatCOP(fee)}</dd>
                </div>
              )}
              <div className={styles.total}>
                <dt>{monthly ? 'Total mensual' : 'Total'}</dt>
                <dd>{formatCOP(total)}</dd>
              </div>
            </dl>
          </div>

          <p className={`panel panel-sm ${styles.certificate}`}>
            <Icon name="file" />
            Recibirás un certificado de donación en tu correo para tu declaración de renta.
          </p>
        </aside>
      </div>
    </div>
  )
}
