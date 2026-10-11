import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CampaignCard from '../../components/cards/CampaignCard'
import Icon from '../../components/ui/Icon'
import { Breadcrumbs } from '../../components/ui/Navigation'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { SelectInput } from '../../components/forms/Field'
import { useCampaigns } from '../../context/CampaignsContext'
import { useAuth } from '../../context/AuthContext'
import { campaignCategories, campaignGoal } from '../../data/campaigns'
import { daysUntil, isFuture } from '../../utils/dates'
import { formatCOP, percent } from '../../utils/format'
import styles from './Donar.module.css'

const sortOptions = [
  { value: 'urgentes', label: 'Más urgentes' },
  { value: 'recientes', label: 'Más recientes' },
  { value: 'casi', label: 'Casi completas' },
  { value: 'menos', label: 'Necesitan más ayuda' },
]

const trust = [
  { icon: 'shield-check', tone: 'primary', title: 'Fundaciones verificadas', text: 'Revisamos RUT, Cámara de comercio y trayectoria.' },
  { icon: 'file', tone: 'info', title: 'Comprobantes públicos', text: 'Cada campaña publica facturas veterinarias y fotos.' },
  { icon: 'heart', tone: 'accent', title: 'Certificado de donación', text: 'Descárgalo al instante para tu declaración de renta.' },
]

// 03 · Donaciones / 01 · Campañas de donación
const Donar = () => {
  const { campaigns } = useCampaigns()
  const { isFoundation } = useAuth()
  const [params] = useSearchParams()
  const [category, setCategory] = useState(params.get('categoria') ?? 'todas')
  const [sort, setSort] = useState('urgentes')

  // Solo las campañas publicadas y vigentes salen en el listado público.
  const active = useMemo(() => campaigns.filter((campaign) => campaign.status === 'Activa' && isFuture(campaign.endDate)), [campaigns])

  // La destacada: la campaña urgente con más donantes.
  const featured = useMemo(() => [...active].filter((campaign) => campaign.urgent).sort((a, b) => b.donors - a.donors)[0] ?? active[0], [active])

  const list = useMemo(() => {
    const filtered = active.filter((campaign) => category === 'todas' || campaign.category === category)
    const sorted = [...filtered]
    if (sort === 'urgentes') sorted.sort((a, b) => Number(b.urgent) - Number(a.urgent) || daysUntil(a.endDate) - daysUntil(b.endDate))
    if (sort === 'recientes') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (sort === 'casi') sorted.sort((a, b) => percent(b.raised, campaignGoal(b)) - percent(a.raised, campaignGoal(a)))
    if (sort === 'menos') sorted.sort((a, b) => percent(a.raised, campaignGoal(a)) - percent(b.raised, campaignGoal(b)))
    return sorted
  }, [active, category, sort])

  const featuredGoal = campaignGoal(featured)
  const featuredPct = percent(featured?.raised ?? 0, featuredGoal)

  return (
    <div className="page page-tint-peach">
      <title>Donar | PetMind</title>

      <div className="container">
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Donar' }]} />
            <h1 className={styles.title}>
              Tu ayuda se convierte
              <br />
              en <span>segundas oportunidades</span>
            </h1>
            <p className={styles.lead}>Dona a campañas verificadas de tratamientos, rescates y alimento. Cada peso se reporta con comprobantes.</p>
            <dl className={styles.stats}>
              <div>
                <dt>donados en {new Date().getFullYear()}</dt>
                <dd>$320M</dd>
              </div>
              <div>
                <dt>tratamientos pagados</dt>
                <dd>1.870</dd>
              </div>
              <div>
                <dt>campañas verificadas</dt>
                <dd>100%</dd>
              </div>
            </dl>
          </div>

          {featured && (
            <article className={styles.featured}>
              <Link to={`/donar/${featured.id}`} className={styles.featuredPhoto} aria-label={`Ver campaña: ${featured.title}`}>
                <img src={featured.photo || undefined} alt="" />
                {featured.urgent && <span className="badge badge-accent">Urgente</span>}
              </Link>
              <div className={styles.featuredBody}>
                <span className={styles.featuredScript}>Campaña destacada</span>
                <h2>
                  <Link to={`/donar/${featured.id}`}>{featured.title}</Link>
                </h2>
                <p>{featured.summary}</p>
                <ProgressBar value={featuredPct} label={`${featuredPct}% recaudado`} />
                <div className={styles.featuredAmounts}>
                  <div>
                    <strong>{formatCOP(featured.raised)}</strong>
                    <span>de {formatCOP(featuredGoal)}</span>
                  </div>
                  <span>{featuredPct}%</span>
                </div>
                <Link className="btn btn-accent btn-block" to={`/donar/${featured.id}/aportar`}>
                  <Icon name="heart" /> Donar a {featured.petName ?? 'la campaña'}
                </Link>
              </div>
            </article>
          )}
        </section>

        <div className={styles.toolbar}>
          <div className="chip-list" role="group" aria-label="Categoría">
            {[{ value: 'todas', plural: 'Todas' }, ...campaignCategories].map((item) => (
              <button
                key={item.value}
                type="button"
                className={`chip-option chip-dark ${category === item.value ? 'active' : ''}`}
                aria-pressed={category === item.value}
                onClick={() => setCategory(item.value)}
              >
                {item.plural}
              </button>
            ))}
          </div>
          <SelectInput icon="filter" aria-label="Ordenar campañas" value={sort} onChange={(event) => setSort(event.target.value)} className={styles.sort}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className={styles.grid}>
          {list.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
          {list.length === 0 && (
            <div className={`empty-state ${styles.empty}`}>
              <h3>No hay campañas activas en esta categoría</h3>
              <p>Mira las demás o dona al Fondo PetMind para que lo repartamos donde más se necesite.</p>
              <button type="button" className="btn btn-primary" onClick={() => setCategory('todas')}>
                Ver todas las campañas
              </button>
            </div>
          )}
        </div>

        <section className={styles.bottom}>
          <div className={styles.fund}>
            <span className="script">¿No sabes a cuál donar?</span>
            <h2>Dona al Fondo PetMind y lo repartimos donde más se necesite</h2>
            <p>Hazlo una vez o conviértete en donante mensual y recibe un reporte de impacto cada mes.</p>
            <div className={styles.fundActions}>
              <Link className="btn btn-white" to="/donar/fondo-petmind/aportar?frecuencia=mensual">
                Mensual
              </Link>
              <Link className="btn btn-glass" to="/donar/fondo-petmind/aportar?frecuencia=unica">
                Una vez
              </Link>
              <Link className="btn btn-glass" to="/donar/fondo-petmind/aportar?monto=20000">
                Desde $20.000
              </Link>
            </div>
            <span className={styles.fundPaw} aria-hidden="true">
              <Icon name="heart-filled" />
            </span>
          </div>

          <div className={`panel ${styles.trust}`}>
            <h2>¿Por qué confiar?</h2>
            <ul>
              {trust.map((item) => (
                <li key={item.title}>
                  <span className={`icon-tile icon-tile-${item.tone}`}>
                    <Icon name={item.icon} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
            {isFoundation && (
              <Link className="btn btn-outline btn-sm" to="/fundacion/campanas/nueva">
                <Icon name="plus" /> Crear una campaña
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Donar
