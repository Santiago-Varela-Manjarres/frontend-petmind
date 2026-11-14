import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { SelectInput } from '../../components/forms/Field'
import { StatusPill } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Icon from '../../components/ui/Icon'
import { Tabs } from '../../components/ui/Navigation'
import { useCampaigns } from '../../context/CampaignsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { useCampanasApi } from '../../hooks/useCampanasApi'
import { campaignGoal, isCampaignLive } from '../../data/campaigns'
import CampanasApiTabla from '../fundacion/api/CampanasApiTabla'
import { daysUntil, formatDate, formatLongDate, isFuture } from '../../utils/dates'
import { formatCOP, percent } from '../../utils/format'
import { isHidden } from '../../utils/moderation'
import { statusTone } from '../fundacion/panel/panelData'
import { AdminHeader, EmptyRows, HiddenPill, SearchField, TableFooter } from './AdminParts'
import { matchesQuery, paginate } from '../../utils/listas'
import { useListParams } from './adminData'
import { useModeration } from './useModeration'
import styles from './Admin.module.css'

const isClosed = (campaign) =>
  ['Finalizada', 'Rechazada'].includes(campaign.status) || (campaign.status === 'Activa' && !isFuture(campaign.endDate))

const tabs = [
  { value: 'todas', label: 'Todas', test: (campaign) => campaign.status !== 'Borrador' },
  { value: 'revision', label: 'Por revisar', test: (campaign) => campaign.status === 'En revisión' && !isHidden(campaign) },
  { value: 'activas', label: 'Activas', test: (campaign) => isCampaignLive(campaign) && isFuture(campaign.endDate) },
  { value: 'retiradas', label: 'Retiradas', test: isHidden },
  { value: 'cerradas', label: 'Cerradas', test: (campaign) => isClosed(campaign) && !isHidden(campaign) },
]

// Los soportes pueden ser texto (datos de prueba) o archivos { name, size } subidos desde el panel.
const fileName = (file) => (typeof file === 'string' ? file : file?.name)

// Panel de administración · Campañas. Arriba, las del servidor (las crean las fundaciones del backend y se
// publican de inmediato); el equipo PetMind también puede crear una a nombre de una fundación. Abajo, las de
// demostración guardadas en el navegador: aprobar las que envían las fundaciones, retirarlas o finalizarlas.
export default function CampanasAdmin() {
  const { campaigns } = useCampaigns()
  const servidor = useCampanasApi()
  const { foundations, getFoundationById } = useFoundations()
  const moderation = useModeration()
  const list = useListParams('todas')
  const [dialog, setDialog] = useState(null)
  // El resumen abre una campaña ya desplegada con ?revisar=<id>.
  const [openId, setOpenId] = useState(() => list.get('revisar') || null)
  const foundationFilter = list.get('fundacion')
  const tab = tabs.find((item) => item.value === list.filter) ?? tabs[0]

  const rows = campaigns
    .filter(
      (campaign) =>
        tab.test(campaign) &&
        (!foundationFilter || campaign.foundationId === foundationFilter) &&
        matchesQuery(list.query, campaign.title, campaign.category, getFoundationById(campaign.foundationId)?.name),
    )
    // Lo que espera revisión va primero; después, lo más reciente.
    .sort(
      (a, b) =>
        Number(b.status === 'En revisión') - Number(a.status === 'En revisión') ||
        new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0),
    )
  const { page, totalPages, pageRows, from, to } = paginate(rows, list.page)
  const withCampaigns = foundations.filter((foundation) => campaigns.some((campaign) => campaign.foundationId === foundation.id))

  function askReject(campaign) {
    setDialog({
      icon: 'alert-triangle',
      tone: 'danger',
      title: `Rechazar “${campaign.title}”`,
      text: 'La campaña vuelve a la fundación con tus observaciones. Puede corregirla y enviarla otra vez a revisión.',
      reasonLabel: 'Qué debe corregir la fundación',
      reasonPlaceholder: 'Ej.: Falta la cotización de la clínica. Adjúntala como soporte para poder aprobarla.',
      confirmLabel: 'Rechazar campaña',
      onConfirm: ({ reason }) => moderation.rejectCampaign(campaign, reason),
    })
  }

  function askHide(campaign) {
    setDialog({
      icon: 'eye-off',
      tone: 'danger',
      title: `Retirar “${campaign.title}”`,
      text: 'Deja de verse en el sitio y no recibe más donaciones. Lo recaudado y los donantes se conservan.',
      reasonLabel: 'Motivo del retiro',
      reasonPlaceholder: 'Ej.: Recibimos reportes de que el tratamiento ya fue pagado. La retiramos mientras la fundación aclara.',
      confirmLabel: 'Retirar campaña',
      onConfirm: ({ reason }) => moderation.hideCampaign(campaign, reason),
    })
  }

  function askFinish(campaign) {
    setDialog({
      icon: 'check-circle',
      title: `Finalizar “${campaign.title}”`,
      text: `Se cierra antes de tiempo con ${formatCOP(campaign.raised)} recaudados y deja de recibir donaciones.`,
      confirmLabel: 'Finalizar campaña',
      onConfirm: () => moderation.finishCampaign(campaign),
    })
  }

  return (
    <div className={styles.page}>
      <AdminHeader
        eyebrow="Publicaciones"
        title="Campañas"
        text="Las campañas de donación de las fundaciones. Crea una a nombre de una fundación o revisa las de demostración antes de que reciban donaciones."
      >
        <Link className="btn btn-primary" to="/admin/campanas/nueva">
          <Icon name="plus" /> Crear campaña
        </Link>
      </AdminHeader>

      <section className={styles.card} aria-labelledby="campanas-servidor">
        <div className={styles.cardHead}>
          <div>
            <h2 id="campanas-servidor">En el servidor</h2>
            <p>Las que crean las fundaciones del backend: se publican en Donar en cuanto las guardan.</p>
          </div>
        </div>
        <CampanasApiTabla
          campaigns={servidor.campaigns}
          status={servidor.status}
          onRetry={servidor.reload}
          newPath="/admin/campanas/nueva"
          conFundacion
        />
      </section>

      <section className={styles.card} aria-labelledby="campanas-demo">
        <div className={styles.cardHead}>
          <div>
            <h2 id="campanas-demo">Datos de demostración</h2>
            <p>Las de las cuentas de demostración, guardadas en este navegador. Pasan por la revisión del equipo PetMind.</p>
          </div>
        </div>
        <Tabs
          label="Filtrar campañas"
          variant="pills"
          value={tab.value}
          onChange={list.setFilter}
          tabs={tabs.map(({ value, label, test }) => ({ value, label, count: campaigns.filter(test).length }))}
        />
        <div className={styles.toolbar}>
          <SearchField value={list.query} onChange={list.setQuery} placeholder="Buscar por título, categoría o fundación" />
          <SelectInput
            icon="building"
            aria-label="Filtrar por fundación"
            value={foundationFilter}
            onChange={(event) => list.set('fundacion', event.target.value)}
          >
            <option value="">Todas las fundaciones</option>
            {withCampaigns.map((foundation) => (
              <option key={foundation.id} value={foundation.id}>
                {foundation.name}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Fundación</th>
                <th>Recaudado / meta</th>
                <th>Cierre</th>
                <th>Estado</th>
                <th className={styles.alignEnd}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((campaign) => {
                const foundation = getFoundationById(campaign.foundationId)
                const goal = campaignGoal(campaign)
                const hidden = isHidden(campaign)
                const inReview = campaign.status === 'En revisión'
                const live = isCampaignLive(campaign) && isFuture(campaign.endDate)
                const open = openId === campaign.id
                const story = Array.isArray(campaign.story) ? campaign.story : [campaign.story].filter(Boolean)
                return (
                  <Fragment key={campaign.id}>
                    <tr>
                      <td>
                        <div className={styles.cell}>
                          <img src={campaign.photo || undefined} alt="" />
                          <span className={styles.cellText}>
                            <strong>{campaign.title}</strong>
                            <small>
                              {campaign.category}
                              {campaign.urgent ? ' · urgente' : ''}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>
                        {foundation ? <Link to={`/admin/fundaciones/${foundation.id}`}>{foundation.name}</Link> : '—'}
                      </td>
                      <td>
                        <strong>{formatCOP(campaign.raised)}</strong>
                        <small className={styles.subtle}> de {formatCOP(goal)}</small>
                        <div className={styles.progress}>
                          <span style={{ width: `${percent(campaign.raised, goal)}%` }} />
                        </div>
                      </td>
                      <td>
                        <span className={styles.stack}>
                          <span>{campaign.endDate ? formatDate(campaign.endDate, { year: true }) : '—'}</span>
                          {campaign.endDate && isFuture(campaign.endDate) && (
                            <small className={styles.subtle}>en {daysUntil(campaign.endDate)} días</small>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className={styles.stack}>
                          <StatusPill tone={statusTone[campaign.status] || 'neutral'} size="sm">
                            {campaign.status === 'Activa' && !isFuture(campaign.endDate) ? 'Cerrada por fecha' : campaign.status}
                          </StatusPill>
                          {hidden && <HiddenPill moderation={campaign.moderation} />}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link className="icon-btn" to={`/donar/${campaign.id}`} aria-label={`Ver “${campaign.title}” en el sitio`} title="Ver en el sitio">
                            <Icon name="eye" />
                          </Link>
                          <button
                            type="button"
                            className={`btn btn-sm ${inReview && !hidden ? 'btn-primary' : 'btn-secondary'}`}
                            aria-expanded={open}
                            onClick={() => setOpenId(open ? null : campaign.id)}
                          >
                            {inReview && !hidden ? 'Revisar' : 'Detalles'}
                            <Icon name={open ? 'chevron-up' : 'chevron-down'} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className={styles.reviewRow}>
                        <td colSpan={6}>
                          <div className={styles.review}>
                            <div>
                              <h3>{campaign.headline || campaign.title}</h3>
                              {campaign.summary && <p>{campaign.summary}</p>}
                              {story.map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                              ))}
                              <p className={styles.subtle}>
                                {campaign.location ? `${campaign.location} · ` : ''}
                                {campaign.endDate ? `Cierra el ${formatLongDate(campaign.endDate)}` : 'Sin fecha de cierre'}
                                {campaign.createdAt ? ` · Enviada el ${formatDate(campaign.createdAt, { year: true })}` : ''}
                              </p>
                              {campaign.status === 'Rechazada' && campaign.review?.reason && (
                                <p className={styles.subtle}>
                                  <strong>Observaciones enviadas:</strong> {campaign.review.reason}
                                </p>
                              )}
                              {hidden && (
                                <p className={styles.subtle}>
                                  <strong>Retirada:</strong> {campaign.moderation.reason}
                                </p>
                              )}
                            </div>
                            <div>
                              <h3>Gastos</h3>
                              <ul className={styles.expenseList}>
                                {(campaign.expenses ?? []).map((expense, index) => (
                                  <li key={`${expense.concept}-${index}`}>
                                    <span>{expense.concept || 'Sin concepto'}</span>
                                    <span>{formatCOP(expense.amount)}</span>
                                  </li>
                                ))}
                                <li>
                                  <span>Meta</span>
                                  <span>{formatCOP(goal)}</span>
                                </li>
                              </ul>
                              <h3 className={styles.reviewSubhead}>Soportes</h3>
                              {campaign.receipts?.length ? (
                                <div className={styles.fileList}>
                                  {campaign.receipts.map((file, index) => (
                                    <span className={styles.fileChip} key={`${fileName(file)}-${index}`}>
                                      <Icon name="file" />
                                      {fileName(file)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className={styles.subtle}>La fundación no adjuntó soportes.</p>
                              )}
                              <div className={styles.reviewActions}>
                                {inReview && !hidden && (
                                  <>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => moderation.approveCampaign(campaign)}>
                                      <Icon name="check" /> Aprobar
                                    </button>
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => askReject(campaign)}>
                                      Rechazar
                                    </button>
                                  </>
                                )}
                                {live && !hidden && (
                                  <>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => askFinish(campaign)}>
                                      Finalizar
                                    </button>
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => askHide(campaign)}>
                                      Retirar del sitio
                                    </button>
                                  </>
                                )}
                                {hidden && (
                                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => moderation.restoreCampaign(campaign)}>
                                    Restaurar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
          {!pageRows.length && <EmptyRows text="No hay campañas con estos filtros." />}
        </div>
        <TableFooter from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={list.setPage} />
      </section>

      <ConfirmDialog {...dialog} open={Boolean(dialog)} onClose={() => setDialog(null)} />
    </div>
  )
}
