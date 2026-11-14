import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { VerifiedBadge } from '../ui/Badges'
import { ProgressBar } from '../ui/ProgressBar'
import { useFoundations } from '../../context/FoundationsContext'
import { campaignGoal, categoryTone } from '../../data/campaigns'
import { daysUntil } from '../../utils/dates'
import { formatCOP, percent, plural } from '../../utils/format'
import styles from './CampaignCard.module.css'

// Tarjeta de campaña (mockup 03 · Donaciones / 01). Con `preview` no navega (vista previa de Crear campaña).
export default function CampaignCard({ campaign, preview = false }) {
  const { getFoundationById } = useFoundations()

  if (!campaign) return null

  // Las campañas del backend traen los datos de su fundación (no tiene perfil local).
  const foundation = campaign.foundation ?? getFoundationById(campaign.foundationId)
  const goal = campaignGoal(campaign)
  const pct = percent(campaign.raised, goal)
  const days = campaign.endDate ? daysUntil(campaign.endDate) : null
  const detailUrl = `/donar/${campaign.id}`
  const Wrapper = preview ? 'div' : Link
  const linkProps = preview ? {} : { to: detailUrl }

  return (
    <article className={styles.card}>
      <Wrapper className={styles.media} {...linkProps} aria-label={preview ? undefined : `Ver campaña: ${campaign.title}`}>
        {campaign.photo ? <img src={campaign.photo} alt="" loading="lazy" /> : <span className={styles.mediaEmpty}><Icon name="image" /></span>}
        {campaign.urgent && <span className={`${styles.badge} ${styles.urgent}`}>Urgente</span>}
        {campaign.category && <span className={`${styles.category} ${styles[`tone-${categoryTone(campaign.category)}`]}`}>{campaign.category}</span>}
      </Wrapper>

      <div className={styles.body}>
        {foundation && (
          <p className={styles.foundation}>
            <Avatar initials={foundation.initials} color={foundation.color} size="xs" shape="rounded" />
            <span>{foundation.name}</span>
            {foundation.verified && <VerifiedBadge size="sm" />}
          </p>
        )}

        <h3 className={styles.title}>
          {preview ? campaign.title || 'Título de la campaña' : <Link to={detailUrl}>{campaign.title}</Link>}
        </h3>

        <div className={styles.progress}>
          <ProgressBar value={pct} label={`${pct}% recaudado`} />
          <div className={styles.amounts}>
            <div>
              <strong>{formatCOP(campaign.raised)}</strong>
              <span>de {formatCOP(goal)}</span>
            </div>
            <span className={styles.pct}>{pct}%</span>
          </div>
          <div className={styles.meta}>
            <span>
              <Icon name="user" /> {plural(campaign.donors, 'donante')}
            </span>
            <span>
              <Icon name="clock" />{' '}
              {days == null ? 'Sin fecha de cierre' : days === 0 ? 'Cierra hoy' : `${plural(days, 'día restante', 'días restantes')}`}
            </span>
          </div>
        </div>

        {preview ? (
          <span className={`btn btn-primary btn-block ${styles.cta}`}>Donar</span>
        ) : (
          <Link className={`btn btn-primary btn-block ${styles.cta}`} to={`/donar/${campaign.id}/aportar`}>
            Donar
          </Link>
        )}
      </div>
    </article>
  )
}
