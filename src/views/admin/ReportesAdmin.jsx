import { useState } from 'react'
import { SelectInput } from '../../components/forms/Field'
import { StatusPill } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Icon from '../../components/ui/Icon'
import { Tabs } from '../../components/ui/Navigation'
import { useFoundations } from '../../context/FoundationsContext'
import { useReports } from '../../context/ReportsContext'
import { verificationOf } from '../../data/foundations'
import { openReportStatuses, reportStatusLabels, reportTypes, urgencyLevels } from '../../data/reports'
import { formatDateTime } from '../../utils/dates'
import { formatPhone } from '../../utils/format'
import { AdminHeader, EmptyRows, SearchField, TableFooter } from './AdminParts'
import { matchesQuery, paginate, useListParams } from './adminData'
import { useModeration } from './useModeration'
import styles from './Admin.module.css'

const tabs = [
  { value: 'abiertos', label: 'Abiertos', test: (report) => openReportStatuses.includes(report.status) },
  { value: 'sin-atender', label: 'Sin atender', test: (report) => report.status === 'notificado' },
  { value: 'en-camino', label: 'En atención', test: (report) => report.status === 'en-camino' },
  { value: 'resueltos', label: 'Resueltos', test: (report) => report.status === 'resuelto' },
  { value: 'descartados', label: 'Descartados', test: (report) => report.status === 'descartado' },
  { value: 'todos', label: 'Todos', test: () => true },
]

const statusTones = { notificado: 'warning', 'en-camino': 'info', resuelto: 'success', descartado: 'neutral' }
const notifiedLabels = { notificada: 'Notificada', visto: 'Vio el caso', tomado: 'Tomó el caso' }
const urgencyRank = { alta: 0, media: 1, baja: 2 }

// Panel de administración · Reportes de animales en riesgo: vigilar que cada caso tenga quién lo atienda.
export default function ReportesAdmin() {
  const { reports } = useReports()
  const { foundations, getFoundationById } = useFoundations()
  const moderation = useModeration()
  const list = useListParams('abiertos')
  const [dialog, setDialog] = useState(null)
  const [assignTo, setAssignTo] = useState({})
  const urgencyFilter = list.get('urgencia')
  const tab = tabs.find((item) => item.value === list.filter) ?? tabs[0]
  const verified = foundations.filter((foundation) => verificationOf(foundation) === 'verificada')

  const rows = reports
    .filter((report) => {
      const type = reportTypes.find((item) => item.value === report.type)
      return (
        tab.test(report) &&
        (!urgencyFilter || report.urgency === urgencyFilter) &&
        matchesQuery(list.query, report.id, report.address, report.description, type?.label, report.contact?.name)
      )
    })
    .sort(
      (a, b) =>
        Number(openReportStatuses.includes(b.status)) - Number(openReportStatuses.includes(a.status)) ||
        (urgencyRank[a.urgency] ?? 3) - (urgencyRank[b.urgency] ?? 3) ||
        new Date(b.createdAt) - new Date(a.createdAt),
    )
  const { page, totalPages, pageRows, from, to } = paginate(rows, list.page)

  function askDiscard(report) {
    setDialog({
      icon: 'x',
      tone: 'danger',
      title: `Descartar el reporte ${report.id}`,
      text: 'Las fundaciones dejan de verlo como pendiente. Úsalo para reportes duplicados, falsos o sin información suficiente.',
      reasonLabel: 'Motivo',
      reasonPlaceholder: 'Ej.: Es el mismo caso del reporte RP-40501, que ya está en atención.',
      confirmLabel: 'Descartar reporte',
      onConfirm: ({ reason }) => moderation.discardReport(report, reason),
    })
  }

  function notify(report) {
    const foundation = getFoundationById(assignTo[report.id])
    if (!foundation) return
    moderation.notifyFoundation(report, foundation)
    setAssignTo((prev) => ({ ...prev, [report.id]: '' }))
  }

  return (
    <div className={styles.page}>
      <AdminHeader
        eyebrow="Seguimiento"
        title="Reportes de animales"
        text="Casos que la comunidad reportó. Si nadie toma un caso urgente, notifícalo a otra fundación verificada."
      />

      <section className={styles.card}>
        <Tabs
          label="Filtrar reportes"
          variant="pills"
          value={tab.value}
          onChange={list.setFilter}
          tabs={tabs.map(({ value, label, test }) => ({ value, label, count: reports.filter(test).length }))}
        />
        <div className={styles.toolbar}>
          <SearchField value={list.query} onChange={list.setQuery} placeholder="Buscar por radicado, dirección o descripción" />
          <SelectInput
            icon="alert-triangle"
            aria-label="Filtrar por urgencia"
            value={urgencyFilter}
            onChange={(event) => list.set('urgencia', event.target.value)}
          >
            <option value="">Cualquier urgencia</option>
            {urgencyLevels.map((level) => (
              <option key={level.value} value={level.value}>
                Urgencia {level.label.toLowerCase()}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className={styles.reportList}>
          {pageRows.map((report) => {
            const type = reportTypes.find((item) => item.value === report.type)
            const urgency = urgencyLevels.find((item) => item.value === report.urgency)
            const open = openReportStatuses.includes(report.status)
            const notifiedIds = (report.notified ?? []).map((item) => item.foundationId)
            const candidates = verified.filter((foundation) => !notifiedIds.includes(foundation.id))
            return (
              <article className={styles.reportCard} key={report.id}>
                <div className={styles.reportTop}>
                  <StatusPill tone={urgency?.tone ?? 'neutral'} size="sm">
                    Urgencia {(urgency?.label ?? report.urgency).toLowerCase()}
                  </StatusPill>
                  <StatusPill tone={statusTones[report.status] ?? 'neutral'} size="sm" dot={false}>
                    {reportStatusLabels[report.status] ?? report.status}
                  </StatusPill>
                  <small>
                    {report.id} · {formatDateTime(report.createdAt)}
                  </small>
                </div>
                <h3>
                  {type?.label ?? report.type} · {report.species}
                </h3>
                <p>{report.description}</p>
                <div className={styles.reportMeta}>
                  <span>
                    <Icon name="map-pin" />
                    {report.address}
                  </span>
                  <span>
                    <Icon name="user" />
                    {report.anonymous ? 'Reporte anónimo' : report.contact?.name}
                    {!report.anonymous && report.contact?.phone ? ` · ${formatPhone(report.contact.phone)}` : ''}
                  </span>
                  {report.photos?.length > 0 && (
                    <span>
                      <Icon name="camera" />
                      {report.photos.length === 1 ? '1 foto' : `${report.photos.length} fotos`}
                    </span>
                  )}
                </div>
                <div className={styles.notifiedList} aria-label="Fundaciones notificadas">
                  {(report.notified ?? []).map((item) => (
                    <span className={styles.notifiedChip} key={item.foundationId}>
                      <b>{getFoundationById(item.foundationId)?.name ?? item.foundationId}</b>
                      {notifiedLabels[item.status] ?? item.status}
                    </span>
                  ))}
                  {!report.notified?.length && <span className={styles.subtle}>Ninguna fundación notificada todavía.</span>}
                </div>
                {report.closed?.reason && (
                  <p className={styles.subtle}>
                    <strong>Motivo del descarte:</strong> {report.closed.reason}
                  </p>
                )}
                <div className={styles.reportActions}>
                  {open ? (
                    <>
                      <div className={styles.assign}>
                        <SelectInput
                          icon="building"
                          aria-label={`Notificar el reporte ${report.id} a otra fundación`}
                          value={assignTo[report.id] ?? ''}
                          onChange={(event) => setAssignTo((prev) => ({ ...prev, [report.id]: event.target.value }))}
                        >
                          <option value="">{candidates.length ? 'Notificar a otra fundación…' : 'Ya se notificó a todas'}</option>
                          {candidates.map((foundation) => (
                            <option key={foundation.id} value={foundation.id}>
                              {foundation.name} · {foundation.city}
                            </option>
                          ))}
                        </SelectInput>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={!assignTo[report.id]}
                          onClick={() => notify(report)}
                        >
                          <Icon name="send" /> Notificar
                        </button>
                      </div>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => moderation.resolveReport(report)}>
                        <Icon name="check" /> Marcar resuelto
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => askDiscard(report)}>
                        Descartar
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => moderation.reopenReport(report)}>
                      Reabrir caso
                    </button>
                  )}
                </div>
              </article>
            )
          })}
          {!pageRows.length && <EmptyRows text="No hay reportes con estos filtros." />}
        </div>
        <TableFooter from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={list.setPage} />
      </section>

      <ConfirmDialog {...dialog} open={Boolean(dialog)} onClose={() => setDialog(null)} />
    </div>
  )
}
