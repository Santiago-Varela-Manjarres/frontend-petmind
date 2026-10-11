import { StatusPill } from '../../../components/ui/Badges'
import { useReports } from '../../../context/ReportsContext'
import { formatDateTime } from '../../../utils/dates'
import Empty from './Empty'
import styles from '../Fundacion.module.css'

// Reportes de animales en riesgo que se notificaron a esta fundación.
export default function ReportsPanel({ foundationId, showToast }) {
  const { reports, updateReport } = useReports()
  const ownReports = reports.filter((report) => report.notified?.some((item) => item.foundationId === foundationId))

  return (
    <section className={styles.reportList}>
      {ownReports.map((report) => {
        const relation = report.notified.find((item) => item.foundationId === foundationId)
        return (
          <article className={styles.card} key={report.id}>
            <StatusPill tone={report.urgency === 'Alta' ? 'danger' : 'warning'}>
              {report.urgency} · {report.species}
            </StatusPill>
            <h2>
              {report.type} · {report.address}
            </h2>
            <p>{report.description}</p>
            <small>
              {report.id} · {formatDateTime(report.createdAt)} · {relation?.distance}
            </small>
            {relation?.status === 'tomado' || report.status === 'en-camino' ? (
              <StatusPill tone="info">Caso en atención</StatusPill>
            ) : (
              report.status === 'notificado' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    updateReport(report.id, {
                      status: 'en-camino',
                      notified: report.notified.map((item) =>
                        item.foundationId === foundationId ? { ...item, status: 'tomado' } : item,
                      ),
                    })
                    showToast('Tomaste el caso. Se notificó a quien lo reportó.', { tone: 'success' })
                  }}
                >
                  Tomar el caso
                </button>
              )
            )}
          </article>
        )
      })}
      {!ownReports.length && <Empty text="No hay reportes cercanos asignados por ahora." />}
    </section>
  )
}
