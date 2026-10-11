import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar'
import Icon from '../../components/ui/Icon'
import { VerifiedBadge } from '../../components/ui/Badges'
import NoEncontrada from '../NoEncontrada'
import { useAuth } from '../../context/AuthContext'
import { useFoundations } from '../../context/FoundationsContext'
import { useReports } from '../../context/ReportsContext'
import { useToast } from '../../context/ToastContext'
import { copyToClipboard } from '../../utils/format'
import styles from './Institucional.module.css'

export default function ReporteEnviado() {
  const { id } = useParams()
  const { getReportById, updateReport } = useReports()
  const { getFoundationById } = useFoundations()
  const { isPerson } = useAuth()
  const { showToast } = useToast()
  const report = getReportById(id)

  useEffect(() => {
    if (!report || report.notified?.[0]?.status !== 'notificada') return undefined
    const timer = window.setTimeout(() => {
      updateReport(id, {
        notified: report.notified.map((item, index) => (index === 0 ? { ...item, status: 'visto' } : item)),
      })
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [id, report, updateReport])

  if (!report)
    return <NoEncontrada title="No encontramos este reporte" backTo="/reportar" backLabel="Crear otro reporte" />
  const notified = report.notified ?? []
  async function copyCode() {
    const ok = await copyToClipboard(report.id)
    showToast(ok ? 'Código copiado.' : 'No pudimos copiar el código.', { tone: ok ? 'success' : 'error' })
  }

  return (
    <main className={styles.reportSentPage}>
      <title>Reporte enviado | PetMind</title>
      <div className={styles.sentGrid}>
        <section className={styles.sentIntro}>
          <span className={styles.sentIcon}>
            <Icon name="send" />
          </span>
          <span className="script">Gracias por no mirar a otro lado</span>
          <h1>Tu reporte fue enviado</h1>
          <p>
            Ya avisamos a {notified.length} fundaciones cerca de la ubicación. Te notificaremos cuando una de ellas tome
            el caso.
          </p>
          <div className={styles.reportCode}>
            <span>Código de seguimiento</span>
            <strong>{report.id}</strong>
            <button type="button" className="btn btn-accent-soft btn-sm" onClick={copyCode}>
              Copiar
            </button>
          </div>
          <Link className="btn btn-primary" to={isPerson ? '/cuenta/reportes' : '/login'}>
            Ver estado del reporte <Icon name="arrow-right" />
          </Link>
          <Link className="link" to="/">
            Volver al inicio
          </Link>
        </section>
        <aside className={styles.notifiedCard}>
          <div className={styles.notifiedHeading}>
            <h2>Fundaciones notificadas</h2>
            <span>● En vivo</span>
          </div>
          {notified.map((item) => {
            const foundation = getFoundationById(item.foundationId)
            if (!foundation) return null
            return (
              <article key={item.foundationId}>
                <Avatar initials={foundation.initials} color={foundation.color} size="md" shape="rounded" />
                <div>
                  <strong>
                    {foundation.name} {foundation.verified && <VerifiedBadge size="sm" />}
                  </strong>
                  <small>
                    {item.distance} · {report.address}
                  </small>
                </div>
                <span
                  className={item.status === 'visto' || item.status === 'tomado' ? styles.statusSeen : styles.statusNew}
                >
                  {item.status === 'visto' ? 'Vio el caso' : item.status === 'tomado' ? 'En camino' : 'Notificada'}
                </span>
              </article>
            )
          })}
          <div className="alert alert-warning">
            <Icon name="alert-triangle" />
            Si puedes, quédate cerca y atento a tu celular: la fundación podría llamarte para ubicar al animal.
          </div>
        </aside>
      </div>
    </main>
  )
}
