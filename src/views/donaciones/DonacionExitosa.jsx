import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { Confetti } from '../../components/ui/Decor'
import { ProgressBar } from '../../components/ui/ProgressBar'
import NoEncontrada from '../NoEncontrada'
import { useDonations } from '../../context/DonationsContext'
import { useCampaigns } from '../../context/CampaignsContext'
import { usePets } from '../../context/PetsContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCampanasApi } from '../../hooks/useCampanasApi'
import { esCampanaApi } from '../../services/campanaMapper'
import { addMonths, formatDate, formatDateTime } from '../../utils/dates'
import { copyToClipboard, downloadTextFile, formatCOP, formatNumber, percent } from '../../utils/format'
import styles from './DonacionExitosa.module.css'

// 03 · Donaciones / 06 · Donación exitosa y comprobante
export default function DonacionExitosa() {
  const { id } = useParams()
  const { getDonationById } = useDonations()
  const { getCampaignById } = useCampaigns()
  const { getPetById } = usePets()
  const { user, isPerson } = useAuth()
  const { showToast } = useToast()

  const donation = getDonationById(id)
  // Si se donó a una campaña del backend, sus datos (título, enlace) llegan de la API.
  useCampanasApi(esCampanaApi(donation?.campaignId))
  if (!donation || donation.status !== 'aprobada') return <NoEncontrada title="No encontramos este comprobante" backTo="/donar" backLabel="Ver campañas" />

  const campaign = getCampaignById(donation.campaignId)
  const pet = donation.forPetId ? getPetById(donation.forPetId) : null
  const monthly = donation.frequency === 'mensual'
  const firstName = donation.donorName.split(' ')[0]
  const beneficiary = pet?.name ?? campaign?.petName
  const goal = donation.goal ?? 1
  const before = percent(donation.raisedBefore ?? 0, goal)
  const after = percent((donation.raisedBefore ?? 0) + donation.amount, goal)
  const shareUrl = `${window.location.origin}/donar/${campaign?.id === 'fondo-petmind' ? '' : (campaign?.id ?? '')}`
  const shareText = `Acabo de donar a "${campaign?.title}" en PetMind. ¡Súmate! ${shareUrl}`

  async function share(kind) {
    if (kind === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')
      return
    }
    if (kind === 'social' && navigator.share) {
      try {
        await navigator.share({ title: 'PetMind', text: shareText, url: shareUrl })
        return
      } catch {
        // cancelado: copiamos el enlace
      }
    }
    const ok = await copyToClipboard(shareUrl)
    showToast(ok ? 'Enlace copiado' : 'No pudimos copiar el enlace', { tone: ok ? 'success' : 'error' })
  }

  const rows = [
    ['Campaña', pet ? `Apadrinar a ${pet.name}` : campaign?.title],
    ['Fundación', donation.foundationName],
    ['Fecha', formatDateTime(donation.date)],
    ['Método', donation.methodLabel],
    ['Referencia', donation.id],
    ...(monthly ? [['Próximo cobro', formatDate(addMonths(donation.date, 1), { year: true })]] : []),
  ]

  function download(kind) {
    const lines = [
      kind === 'certificado' ? 'CERTIFICADO DE DONACIÓN' : 'COMPROBANTE DE DONACIÓN',
      'PetMind · Conectamos vidas, cambiamos historias',
      '',
      `Donante: ${donation.anonymous ? 'Anónimo' : donation.donorName}`,
      donation.document ? `Documento: ${donation.document}` : '',
      donation.company ? `Empresa: ${donation.company.name} · NIT ${donation.company.nit}` : '',
      ...rows.map(([label, value]) => `${label}: ${value}`),
      `Donación: ${formatCOP(donation.amount)}`,
      donation.fee ? `Costos de la plataforma: ${formatCOP(donation.fee)}` : '',
      `Total: ${formatCOP(donation.total)}${monthly ? ' / mes' : ''}`,
      '',
      'Documento de demostración generado en el navegador.',
    ].filter(Boolean)
    downloadTextFile(`${kind}-${donation.id}.txt`, lines.join('\n'))
    showToast(kind === 'certificado' ? 'Descargamos tu certificado' : 'Descargamos tu comprobante')
  }

  return (
    <section className={styles.page}>
      <title>¡Gracias por donar! | PetMind</title>
      <Confetti />

      <div className={`container ${styles.layout}`}>
        <div className={styles.message}>
          <p className={styles.script}>¡Gracias, {donation.anonymous ? 'de corazón' : firstName}!</p>
          <h1 className={styles.title}>
            {beneficiary ? (
              <>
                Acabas de acercar a {beneficiary} a su <span>segunda oportunidad</span>
              </>
            ) : (
              <>
                Tu aporte ya está <span>cambiando vidas</span>
              </>
            )}
          </h1>
          <p className={styles.lead}>
            {monthly ? 'Tu donación mensual ya está activa.' : 'Tu donación fue aprobada.'} Te enviamos el comprobante y el certificado a {donation.email}.
          </p>

          {campaign && (
            <div className={styles.progressCard}>
              <img src={pet?.photo ?? campaign.photo} alt="" />
              <div className={styles.progressBody}>
                <strong>
                  {campaign.id === 'fondo-petmind' ? 'El Fondo PetMind' : `La campaña${campaign.petName ? ` de ${campaign.petName}` : ''}`} ahora va en {after}%
                </strong>
                <span>
                  {formatCOP((donation.raisedBefore ?? 0) + donation.amount)} de {formatCOP(goal)} · {formatNumber((donation.donorsBefore ?? 0) + 1)} donantes
                </span>
                <ProgressBar value={before} extra={Math.max(after - before, 1)} label={`${after}% de la meta`} />
                <div className={styles.progressLabels}>
                  <span>Antes {before}%</span>
                  <span>+ tu aporte</span>
                </div>
              </div>
            </div>
          )}

          <h2 className={styles.shareTitle}>Multiplica tu ayuda: comparte la campaña</h2>
          <div className={styles.share}>
            <button type="button" className="btn btn-secondary" onClick={() => share('whatsapp')}>
              <Icon name="message" /> WhatsApp
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => share('social')}>
              <Icon name="share" /> Redes sociales
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => share('copy')}>
              <Icon name="copy" /> Copiar enlace
            </button>
          </div>

          <div className={styles.actions}>
            <Link className="btn btn-primary btn-lg" to="/donar">
              Ver más campañas <Icon name="arrow-right" />
            </Link>
            {isPerson && user?.id === donation.userId ? (
              <Link className="btn btn-secondary btn-lg" to="/cuenta/donaciones">
                Ir a mis donaciones
              </Link>
            ) : (
              <Link className="btn btn-secondary btn-lg" to="/registro">
                Crear mi cuenta
              </Link>
            )}
          </div>
        </div>

        <aside className={styles.receipt} aria-label="Comprobante">
          <div className={styles.receiptTop}>
            <span className={styles.check}>
              <Icon name="check" strokeWidth={3} />
            </span>
            <p className={styles.amount}>
              {formatCOP(donation.total)}
              {monthly && <small> / mes</small>}
            </p>
            <span className={styles.approved}>
              <Icon name="check" strokeWidth={3} /> Donación aprobada
            </span>
          </div>
          <div className={styles.cut} aria-hidden="true" />
          <dl className={styles.rows}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.downloads}>
            <button type="button" className="btn btn-secondary btn-block btn-lg" onClick={() => download('certificado')}>
              <Icon name="file" /> Descargar certificado
            </button>
            <button type="button" className="btn btn-secondary btn-block btn-lg" onClick={() => download('comprobante')}>
              <Icon name="file" /> Descargar comprobante
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}
