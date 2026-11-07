import { Link } from 'react-router-dom'
import StatTile from '../../components/cards/StatTile'
import Avatar from '../../components/ui/Avatar'
import { StatusPill } from '../../components/ui/Badges'
import Icon from '../../components/ui/Icon'
import { useAdminLog } from '../../context/AdminLogContext'
import { useAuth } from '../../context/AuthContext'
import { useCampaigns } from '../../context/CampaignsContext'
import { useDonations } from '../../context/DonationsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { useReports } from '../../context/ReportsContext'
import { useStories } from '../../context/StoriesContext'
import { campaignGoal, isCampaignLive } from '../../data/campaigns'
import { verificationOf } from '../../data/foundations'
import { isAdoptable } from '../../data/pets'
import { openReportStatuses, reportTypes, urgencyLevels } from '../../data/reports'
import { isFuture, timeAgo } from '../../utils/dates'
import { formatCOP, formatCOPShort, plural } from '../../utils/format'
import { isHidden } from '../../utils/moderation'
import { ActivityList, AdminHeader } from './AdminParts'
import styles from './Admin.module.css'

const urgencyRank = { alta: 0, media: 1, baja: 2 }
const waitingSince = (foundation) => new Date(foundation.verification?.date ?? foundation.createdAt ?? 0)

// Panel de administración · Resumen: cifras de la plataforma y lo que espera una decisión.
export default function ResumenAdmin() {
  const { users } = useAuth()
  const { foundations, getFoundationById } = useFoundations()
  const { pets } = usePets()
  const { campaigns } = useCampaigns()
  const { donations } = useDonations()
  const { reports } = useReports()
  const { stories } = useStories()
  const { entries } = useAdminLog()

  // Colas de trabajo: primero lo que lleva más tiempo esperando (y en reportes, lo más urgente).
  const pendingFoundations = foundations
    .filter((foundation) => verificationOf(foundation) === 'pendiente')
    .sort((a, b) => waitingSince(a) - waitingSince(b))
  const campaignsInReview = campaigns
    .filter((campaign) => campaign.status === 'En revisión')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const unattendedReports = reports
    .filter((report) => report.status === 'notificado')
    .sort((a, b) => (urgencyRank[a.urgency] ?? 3) - (urgencyRank[b.urgency] ?? 3) || new Date(b.createdAt) - new Date(a.createdAt))

  const verifiedCount = foundations.filter((foundation) => verificationOf(foundation) === 'verificada').length
  const adoptableCount = pets.filter(isAdoptable).length
  const liveCampaigns = campaigns.filter((campaign) => isCampaignLive(campaign) && isFuture(campaign.endDate)).length
  const raised = donations
    .filter((donation) => donation.status === 'aprobada')
    .reduce((total, donation) => total + (Number(donation.amount) || 0), 0)
  const hiddenCount = [...pets, ...campaigns, ...stories].filter(isHidden).length

  // "Tienes 2 fundaciones por verificar y 1 reporte sin atender." (solo lo que de verdad está pendiente)
  const pendingWork = [
    [pendingFoundations.length, 'fundación por verificar', 'fundaciones por verificar'],
    [campaignsInReview.length, 'campaña por revisar', 'campañas por revisar'],
    [unattendedReports.length, 'reporte sin atender', 'reportes sin atender'],
  ]
    .filter(([count]) => count > 0)
    .map(([count, one, many]) => plural(count, one, many))
  const pendingText =
    pendingWork.length > 1 ? `${pendingWork.slice(0, -1).join(', ')} y ${pendingWork.at(-1)}` : pendingWork[0]

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Hola, equipo PetMind"
        text={
          pendingText
            ? `Tienes ${pendingText}.`
            : 'Todo está al día: no hay fundaciones, campañas ni reportes esperando una decisión.'
        }
      >
        <Link className="btn btn-secondary" to="/admin/campanas?estado=revision">
          <Icon name="heart" />
          Revisar campañas
        </Link>
        <Link className="btn btn-primary" to="/admin/fundaciones?estado=pendiente">
          <Icon name="shield-check" />
          Verificar fundaciones
        </Link>
      </AdminHeader>

      <div className={styles.stats}>
        <StatTile icon="building" tone="info" label="Fundaciones verificadas" value={verifiedCount} />
        <StatTile icon="paw" tone="primary" label="Mascotas en adopción" value={adoptableCount} />
        <StatTile icon="heart" tone="accent" label="Campañas recibiendo donaciones" value={liveCampaigns} />
        <StatTile icon="star" tone="purple" label="Donado a través de PetMind" value={formatCOPShort(raised)} />
      </div>

      <div className={styles.columns}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Fundaciones por verificar</h2>
            <Link to="/admin/fundaciones?estado=pendiente">
              Ver todas <Icon name="arrow-right" />
            </Link>
          </div>
          {pendingFoundations.length ? (
            <div className={styles.queue}>
              {pendingFoundations.slice(0, 4).map((foundation) => (
                <Link className={styles.queueRow} to={`/admin/fundaciones/${foundation.id}`} key={foundation.id}>
                  <Avatar name={foundation.name} initials={foundation.initials} color={foundation.color} size="sm" />
                  <span className={styles.queueText}>
                    <strong>{foundation.name}</strong>
                    <small>
                      {foundation.city} · espera desde {timeAgo(waitingSince(foundation))}
                    </small>
                  </span>
                  <Icon name="chevron-right" />
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>No hay fundaciones esperando verificación.</p>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Campañas por revisar</h2>
            <Link to="/admin/campanas?estado=revision">
              Ver todas <Icon name="arrow-right" />
            </Link>
          </div>
          {campaignsInReview.length ? (
            <div className={styles.queue}>
              {campaignsInReview.slice(0, 4).map((campaign) => (
                <Link
                  className={styles.queueRow}
                  to={`/admin/campanas?estado=revision&revisar=${campaign.id}`}
                  key={campaign.id}
                >
                  <img src={campaign.photo || undefined} alt="" />
                  <span className={styles.queueText}>
                    <strong>{campaign.title}</strong>
                    <small>
                      {getFoundationById(campaign.foundationId)?.name ?? 'Fundación'} · meta {formatCOP(campaignGoal(campaign))}
                    </small>
                  </span>
                  <Icon name="chevron-right" />
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>No hay campañas esperando aprobación.</p>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Reportes sin atender</h2>
            <Link to="/admin/reportes?estado=sin-atender">
              Ver todos <Icon name="arrow-right" />
            </Link>
          </div>
          {unattendedReports.length ? (
            <div className={styles.queue}>
              {unattendedReports.slice(0, 4).map((report) => {
                const type = reportTypes.find((item) => item.value === report.type)
                const urgency = urgencyLevels.find((item) => item.value === report.urgency)
                return (
                  <Link className={styles.queueRow} to={`/admin/reportes?q=${report.id}`} key={report.id}>
                    <StatusPill tone={urgency?.tone ?? 'neutral'} size="sm">
                      {urgency?.label ?? report.urgency}
                    </StatusPill>
                    <span className={styles.queueText}>
                      <strong>
                        {type?.label ?? report.type} · {report.species}
                      </strong>
                      <small>
                        {report.address} · {timeAgo(report.createdAt)}
                      </small>
                    </span>
                    <Icon name="chevron-right" />
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className={styles.mutedText}>Las fundaciones ya tomaron todos los casos reportados.</p>
          )}
        </section>
      </div>

      <div className={styles.columnsWide}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h2>Actividad reciente</h2>
              <p>Cada decisión queda registrada con su motivo.</p>
            </div>
          </div>
          <ActivityList entries={entries.slice(0, 6)} />
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>La comunidad en cifras</h2>
          </div>
          <ul className={styles.figures}>
            <li>
              <Link to="/admin/usuarios?estado=personas">Personas registradas</Link>
              <strong>{users.filter((item) => item.accountType === 'persona').length}</strong>
            </li>
            <li>
              <Link to="/admin/fundaciones">Fundaciones registradas</Link>
              <strong>{foundations.length}</strong>
            </li>
            <li>
              <Link to="/admin/usuarios?estado=suspendidas">Cuentas suspendidas</Link>
              <strong>{users.filter((item) => item.suspended).length}</strong>
            </li>
            <li>
              <Link to="/admin/mascotas?estado=retiradas">Publicaciones retiradas</Link>
              <strong>{hiddenCount}</strong>
            </li>
            <li>
              <Link to="/admin/reportes">Reportes abiertos</Link>
              <strong>{reports.filter((report) => openReportStatuses.includes(report.status)).length}</strong>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
