import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import CampaignCard from '../../components/cards/CampaignCard'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { VerifiedBadge } from '../../components/ui/Badges'
import { Breadcrumbs, Tabs } from '../../components/ui/Navigation'
import { ProgressBar } from '../../components/ui/ProgressBar'
import NoEncontrada from '../NoEncontrada'
import { useCampaigns } from '../../context/CampaignsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { useDonations } from '../../context/DonationsContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useToast } from '../../context/ToastContext'
import { campaignCategories, campaignGoal, defaultImpacts } from '../../data/campaigns'
import { dayOfMonth, daysUntil, formatDate, isFuture, monthShort, timeAgo } from '../../utils/dates'
import { copyToClipboard, downloadTextFile, formatCOP, formatNumber, initials, percent } from '../../utils/format'
import styles from './DetallesCampana.module.css'

const expenseColors = ['#0b6b67', '#4f8fc4', '#e3a23b', '#f17155', '#8a6bc2', '#3c8d5a']
const avatarColors = ['primary', 'accent', 'info', 'purple', 'warning', 'green']

// 03 · Donaciones / 02 · Detalle de la campaña
const DetallesCampana = () => {
  const { id } = useParams()
  const { campaigns, getCampaignById } = useCampaigns()
  const { getFoundationById } = useFoundations()
  const { donations } = useDonations()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [amount, setAmount] = useState(50000)
  const [tab, setTab] = useState('historia')
  const [showAllDonors, setShowAllDonors] = useState(false)

  const campaign = getCampaignById(id)
  if (id === 'fondo-petmind') return <Navigate to="/donar/fondo-petmind/aportar" replace />
  if (!campaign) return <NoEncontrada title="No encontramos esta campaña" text="Puede que haya terminado o que el enlace esté mal escrito." backTo="/donar" backLabel="Ver campañas activas" />

  const foundation = getFoundationById(campaign.foundationId)
  const goal = campaignGoal(campaign)
  const pct = percent(campaign.raised, goal)
  const days = daysUntil(campaign.endDate)
  const closed = !isFuture(campaign.endDate) || campaign.status !== 'Activa'
  const impacts = (campaign.impacts ?? defaultImpacts).slice(0, 3)
  const category = campaignCategories.find((item) => item.value === campaign.category)
  const following = isFavorite('campaigns', campaign.id)
  const petName = campaign.petName ?? 'la campaña'
  const recent = donations
    .filter((donation) => donation.campaignId === campaign.id && donation.status === 'aprobada')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const shownDonors = showAllDonors ? recent : recent.slice(0, 4)
  const others = campaigns.filter((item) => item.id !== campaign.id && item.status === 'Activa' && isFuture(item.endDate)).slice(0, 3)
  const story = Array.isArray(campaign.story) ? campaign.story : [campaign.story].filter(Boolean)

  function toggleFollow() {
    if (!toggleFavorite('campaigns', campaign.id)) {
      navigate('/login', { state: { from: location.pathname, reason: 'favoritos' } })
      return
    }
    showToast(following ? 'Dejaste de seguir esta campaña' : 'Te avisaremos de cada actualización')
  }

  async function share() {
    const ok = await copyToClipboard(window.location.href)
    showToast(ok ? 'Enlace copiado. ¡Compártelo!' : 'No pudimos copiar el enlace.', { tone: ok ? 'success' : 'error' })
  }

  function downloadReceipt(name) {
    downloadTextFile(name.replace('.pdf', '.txt'), `${name}\n\nCampaña: ${campaign.title}\nFundación: ${foundation?.name}\n\nDocumento de demostración verificado por PetMind.`)
  }

  const expenseList = (
    <section className={`panel ${styles.block}`}>
      <h2 className={styles.blockTitle}>¿En qué se usará tu donación?</h2>
      <div className={styles.stack} aria-hidden="true">
        {campaign.expenses.map((expense, index) => (
          <span key={expense.concept} style={{ flexGrow: expense.amount, background: expenseColors[index % expenseColors.length] }} />
        ))}
      </div>
      <ul className={styles.legend}>
        {campaign.expenses.map((expense, index) => (
          <li key={expense.concept}>
            <span className={styles.dot} style={{ background: expenseColors[index % expenseColors.length] }} />
            <span className={styles.concept}>{expense.concept}</span>
            <strong>{formatCOP(expense.amount)}</strong>
          </li>
        ))}
      </ul>
      {campaign.quoteDocument && (
        <div className={styles.quoteRow}>
          <Icon name="file" />
          <span>{campaign.quoteDocument}</span>
          <button type="button" className="link-button" onClick={() => downloadReceipt(campaign.receipts?.[0] ?? 'cotizacion.pdf')}>
            Ver PDF
          </button>
        </div>
      )}
    </section>
  )

  const updatesList = (
    <section className={`panel ${styles.block}`}>
      <h2 className={styles.blockTitle}>Últimas actualizaciones</h2>
      {(campaign.updates ?? []).length === 0 ? (
        <p>La fundación aún no ha publicado actualizaciones. Si sigues la campaña te avisaremos.</p>
      ) : (
        <ol className={styles.updates}>
          {campaign.updates.map((update) => (
            <li key={update.title}>
              <span className={styles.dateBadge}>
                <strong>{dayOfMonth(update.date)}</strong>
                {monthShort(update.date).toUpperCase()}
              </span>
              <div>
                <h3>{update.title}</h3>
                <p>{update.text}</p>
                {update.photo && <img src={update.photo} alt="" className={styles.updatePhoto} />}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )

  return (
    <div className="page">
      <title>{`${campaign.title} | PetMind`}</title>

      <div className="container">
        <div className={styles.layout}>
          <div className={styles.main}>
            <Breadcrumbs items={[{ label: 'Donar', to: '/donar' }, { label: category?.plural ?? campaign.category, to: `/donar?categoria=${campaign.category}` }, { label: campaign.title }]} />

            <div className={styles.tags}>
              {campaign.urgent && <span className="badge badge-accent">Urgente</span>}
              <span className="badge badge-soft-accent">{campaign.category}</span>
              <span className={styles.location}>
                <Icon name="map-pin" /> {campaign.location}
              </span>
            </div>
            <h1 className={styles.title}>{campaign.headline ?? campaign.title}</h1>
            {foundation && (
              <p className={styles.byline}>
                <Avatar initials={foundation.initials} color={foundation.color} size="sm" shape="rounded" />
                Campaña creada por{' '}
                <Link to={`/fundaciones/${foundation.id}`} className={styles.foundationLink}>
                  Fundación {foundation.name}
                </Link>
                {foundation.verified && <VerifiedBadge />}
                <span className={styles.date}>· {formatDate(campaign.createdAt, { year: true })}</span>
              </p>
            )}

            <div className={styles.photos}>
              <figure className={styles.photo}>
                <img src={campaign.photo || undefined} alt={`Foto de la campaña ${campaign.title}`} />
                {campaign.photoLabel && <span className="badge badge-dark">{campaign.photoLabel}</span>}
              </figure>
              <div className={styles.after}>
                <span className="script">Su “después” lo escribes tú</span>
                <p>La foto de {petName === 'la campaña' ? 'la meta cumplida' : `${petName} recuperado`} aparecerá aquí cuando completemos la meta.</p>
              </div>
            </div>

            <Tabs
              className={styles.tabs}
              value={tab}
              onChange={setTab}
              label="Información de la campaña"
              tabs={[
                { value: 'historia', label: 'Historia' },
                { value: 'actualizaciones', label: 'Actualizaciones', count: campaign.updates?.length || undefined },
                { value: 'uso', label: 'Uso del dinero' },
                { value: 'comprobantes', label: 'Comprobantes' },
              ]}
            />

            <div className={styles.tabPanel} role="tabpanel">
              {tab === 'historia' && (
                <>
                  <div className={styles.story}>
                    {story.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {expenseList}
                  {updatesList}
                </>
              )}
              {tab === 'actualizaciones' && updatesList}
              {tab === 'uso' && expenseList}
              {tab === 'comprobantes' && (
                <section className={`panel ${styles.block}`}>
                  <h2 className={styles.blockTitle}>Comprobantes</h2>
                  {(campaign.receipts ?? []).length === 0 ? (
                    <p>La fundación subirá las facturas a medida que use el dinero.</p>
                  ) : (
                    <ul className={styles.receipts}>
                      {campaign.receipts.map((receipt) => (
                        <li key={receipt}>
                          <span className="icon-tile icon-tile-info">
                            <Icon name="file" />
                          </span>
                          <span>{receipt}</span>
                          <button type="button" className="link-button" onClick={() => downloadReceipt(receipt)}>
                            Descargar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>

          <aside className={styles.aside}>
            <section className={`panel ${styles.donateCard}`}>
              <strong className={styles.raised}>{formatCOP(campaign.raised)}</strong>
              <p className={styles.goal}>recaudados de una meta de {formatCOP(goal)}</p>
              <ProgressBar value={pct} size="lg" label={`${pct}% de la meta`} />
              <dl className={styles.numbers}>
                <div>
                  <dt>de la meta</dt>
                  <dd>{pct}%</dd>
                </div>
                <div>
                  <dt>donantes</dt>
                  <dd>{formatNumber(campaign.donors)}</dd>
                </div>
                <div>
                  <dt>{days === 0 ? 'cierra hoy' : days === 1 ? 'día restante' : 'días restantes'}</dt>
                  <dd>{days}</dd>
                </div>
              </dl>

              {closed ? (
                <p className="alert alert-neutral">Esta campaña ya cerró. ¡Gracias a todos los que donaron!</p>
              ) : (
                <>
                  <div className={styles.amounts} role="radiogroup" aria-label="Monto">
                    {impacts.map((impact) => (
                      <button
                        key={impact.amount}
                        type="button"
                        role="radio"
                        aria-checked={amount === impact.amount}
                        className={`${styles.amount} ${amount === impact.amount ? styles.amountActive : ''}`}
                        onClick={() => setAmount(impact.amount)}
                        title={impact.label}
                      >
                        {formatCOP(impact.amount)}
                      </button>
                    ))}
                  </div>
                  <Link className={`btn btn-accent btn-block btn-lg ${styles.donateButton}`} to={`/donar/${campaign.id}/aportar?monto=${amount}`}>
                    <Icon name="heart" /> Donar a {campaign.petName ?? 'la campaña'}
                  </Link>
                </>
              )}
              <div className={styles.secondary}>
                <button type="button" className="btn btn-secondary" onClick={share}>
                  <Icon name="share" /> Compartir
                </button>
                <button type="button" className={`btn btn-secondary ${following ? styles.following : ''}`} onClick={toggleFollow} aria-pressed={following}>
                  <Icon name={following ? 'heart-filled' : 'heart'} /> {following ? 'Siguiendo' : 'Seguir'}
                </button>
              </div>
            </section>

            <section className={`panel panel-sm ${styles.donors}`}>
              <div className={styles.donorsHeader}>
                <h2>Donaciones recientes</h2>
                {campaign.donors > 4 && recent.length > 4 && (
                  <button type="button" className="link-button" onClick={() => setShowAllDonors((prev) => !prev)}>
                    {showAllDonors ? 'Ver menos' : `Ver las ${formatNumber(campaign.donors)}`}
                  </button>
                )}
              </div>
              {recent.length === 0 ? (
                <p className={styles.noDonors}>¡Sé la primera persona en donar!</p>
              ) : (
                <ul>
                  {shownDonors.map((donation, index) => {
                    const name = donation.anonymous || donation.showName === false ? 'Anónimo' : donation.donorName
                    return (
                      <li key={donation.id}>
                        <Avatar initials={donation.anonymous ? 'AN' : (donation.initials ?? initials(name))} color={donation.color ?? avatarColors[index % avatarColors.length]} size="md" />
                        <div>
                          <strong>{name}</strong>
                          <span>
                            {timeAgo(donation.date)}
                            {donation.message ? ` · “${donation.message}”` : ''}
                          </span>
                        </div>
                        <span className={styles.donorAmount}>{formatCOP(donation.amount)}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className={`panel panel-sm ${styles.verified}`}>
              <span className="icon-tile">
                <Icon name="shield-check" />
              </span>
              <div>
                <strong>Campaña verificada</strong>
                <span>El dinero se entrega a la clínica contra factura.</span>
              </div>
            </section>
          </aside>
        </div>

        {others.length > 0 && (
          <section className={styles.others}>
            <div className="section-heading">
              <h2>Otras campañas que necesitan ayuda</h2>
              <Link className="section-link" to="/donar">
                Ver todas <Icon name="arrow-right" />
              </Link>
            </div>
            <div className="grid-3">
              {others.map((item) => (
                <CampaignCard key={item.id} campaign={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default DetallesCampana
