import { Link } from 'react-router-dom'
import { StatusPill } from '../../../components/ui/Badges'
import Icon from '../../../components/ui/Icon'
import { Tabs } from '../../../components/ui/Navigation'
import { campaignGoal, isCampaignOpen } from '../../../data/campaigns'
import { daysUntil, formatDate } from '../../../utils/dates'
import { formatCOP, percent } from '../../../utils/format'
import { matchesQuery, paginate } from '../../../utils/listas'
import { BarraFiltros, EstadoLista, PieTabla, SinFilas } from './TablaApiPartes'
import { useFiltrosTabla } from './useFiltrosTabla'
import styles from './PanelApi.module.css'

const filtros = [
  { value: 'todas', label: 'Todas', test: () => true },
  { value: 'activas', label: 'Activas', test: isCampaignOpen },
  { value: 'cerradas', label: 'Cerradas', test: (campaign) => !isCampaignOpen(campaign) && campaign.status !== 'Cancelada' },
  { value: 'canceladas', label: 'Canceladas', test: (campaign) => campaign.status === 'Cancelada' },
]

const masReciente = (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0) || b.backendId - a.backendId

function Estado({ campaign }) {
  if (isCampaignOpen(campaign)) {
    return (
      <StatusPill tone="success" size="sm">
        Activa · en Donar
      </StatusPill>
    )
  }
  if (campaign.status === 'Activa') {
    return (
      <StatusPill tone="neutral" size="sm">
        Cerrada por fecha
      </StatusPill>
    )
  }
  return (
    <StatusPill tone={campaign.status === 'Cancelada' ? 'danger' : 'neutral'} size="sm">
      {campaign.status}
    </StatusPill>
  )
}

// Tabla de campañas del backend (ya convertidas con mapearCampana) con pestañas, búsqueda y paginación.
// conFundacion: muestra la columna y el filtro por fundación (panel de administración).
export default function CampanasApiTabla({ campaigns, status, onRetry, newPath, conFundacion = false }) {
  const filtrosTabla = useFiltrosTabla()
  const { query, fundacion } = filtrosTabla

  if (status !== 'success') return <EstadoLista status={status} recurso="campañas" onRetry={onRetry} />

  const actual = filtros.find((item) => item.value === filtrosTabla.filtro) ?? filtros[0]
  const rows = campaigns
    .filter(
      (campaign) =>
        actual.test(campaign) &&
        (!fundacion || campaign.foundationId === fundacion) &&
        matchesQuery(query, campaign.title, campaign.categoryLabel, campaign.foundation?.name),
    )
    .sort(masReciente)
  const { page, totalPages, pageRows, from, to } = paginate(rows, filtrosTabla.page)
  // Las fundaciones que tienen campañas, por nombre (el valor es el id del sitio, "api-<id>").
  const opcionesFundacion = conFundacion
    ? [...new Map(campaigns.filter((item) => item.foundation).map((item) => [item.foundationId, item.foundation.name]))]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'))
    : null

  return (
    <>
      <Tabs
        label="Filtrar campañas"
        variant="pills"
        value={actual.value}
        onChange={filtrosTabla.setFiltro}
        tabs={filtros.map((item) => ({ value: item.value, label: item.label, count: campaigns.filter(item.test).length }))}
      />
      <BarraFiltros
        query={query}
        onQuery={filtrosTabla.setQuery}
        placeholder={conFundacion ? 'Buscar por título, categoría o fundación' : 'Buscar por título o categoría'}
        label="Buscar campañas"
        opcionesFundacion={opcionesFundacion}
        fundacion={fundacion}
        onFundacion={filtrosTabla.setFundacion}
      />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Campaña</th>
              {conFundacion && <th>Fundación</th>}
              <th>Recaudado / meta</th>
              <th>Cierre</th>
              <th>Estado</th>
              <th className={styles.alignEnd}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((campaign) => {
              const goal = campaignGoal(campaign)
              return (
                <tr key={campaign.id}>
                  <td>
                    <div className={styles.cell}>
                      {campaign.photo ? (
                        <img src={campaign.photo} alt="" />
                      ) : (
                        <span className={styles.noPhoto}>
                          <Icon name="heart" />
                        </span>
                      )}
                      <span className={styles.cellText}>
                        <strong>{campaign.title}</strong>
                        <small>
                          {campaign.categoryLabel}
                          {campaign.petName ? ` · ${campaign.petName}` : ''}
                          {campaign.urgent ? ' · urgente' : ''}
                        </small>
                      </span>
                    </div>
                  </td>
                  {conFundacion && <td>{campaign.foundation?.name ?? '—'}</td>}
                  <td>
                    <strong>{formatCOP(campaign.raised)}</strong>
                    <span className={styles.subtle}> de {formatCOP(goal)}</span>
                    <div className={styles.progress}>
                      <span style={{ width: `${percent(campaign.raised, goal)}%` }} />
                    </div>
                  </td>
                  <td>
                    <span className={styles.stack}>
                      <span className={styles.nowrap}>{campaign.endDate ? formatDate(campaign.endDate, { year: true }) : 'Sin fecha'}</span>
                      {isCampaignOpen(campaign) && <small className={styles.subtle}>en {daysUntil(campaign.endDate)} días</small>}
                    </span>
                  </td>
                  <td>
                    <Estado campaign={campaign} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link className="icon-btn" to={`/donar/${campaign.id}`} aria-label={`Ver “${campaign.title}” en Donar`} title="Ver en Donar">
                        <Icon name="eye" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!pageRows.length && (
          <SinFilas
            icon="heart"
            hayDatos={campaigns.length > 0}
            sinDatos="Todavía no hay campañas"
            sinCoincidencias="No hay campañas con estos filtros"
            ayuda="Prueba con otro título o quita algún filtro."
            newPath={newPath}
            accion="Crear la primera campaña"
          />
        )}
      </div>
      <PieTabla from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={filtrosTabla.setPage} />
    </>
  )
}
