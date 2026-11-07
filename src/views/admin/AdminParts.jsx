import { Link } from 'react-router-dom'
import { StatusPill } from '../../components/ui/Badges'
import Icon from '../../components/ui/Icon'
import { Pagination } from '../../components/ui/Navigation'
import { timeAgo } from '../../utils/dates'
import { targetInfo } from './adminData'
import styles from './Admin.module.css'

// Piezas que repiten todas las pantallas del panel de administración.

export function AdminHeader({ eyebrow = 'Panel de administración', title, text, children }) {
  return (
    <header className={styles.heading}>
      <title>{`${title} | Administración PetMind`}</title>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children && <div className={styles.headingActions}>{children}</div>}
    </header>
  )
}

export function SearchField({ value, onChange, placeholder, label }) {
  return (
    <div className={styles.searchField}>
      <Icon name="search" />
      <input
        className="input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function TableFooter({ from, to, total, page, totalPages, onPage }) {
  return (
    <div className={styles.tableFooter}>
      <span>
        Mostrando {from}–{to} de {total}
      </span>
      <Pagination page={page} totalPages={totalPages} onChange={onPage} />
    </div>
  )
}

export function EmptyRows({ title = 'No hay resultados', text }) {
  return (
    <div className={styles.empty}>
      <Icon name="search" />
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  )
}

// "Retirada por PetMind" con el motivo al pasar el mouse (y para lectores de pantalla).
export function HiddenPill({ moderation, label = 'Retirada por PetMind' }) {
  return (
    <span className={styles.hiddenPill} title={moderation?.reason}>
      <StatusPill tone="danger" size="sm">
        {label}
      </StatusPill>
      {moderation?.reason && <span className="sr-only">Motivo: {moderation.reason}</span>}
    </span>
  )
}

// Bitácora de decisiones (resumen y detalle de fundación).
export function ActivityList({ entries, emptyText = 'Todavía no hay decisiones registradas.', showTarget = true }) {
  if (!entries.length) return <p className={styles.mutedText}>{emptyText}</p>

  return (
    <ol className={styles.activity}>
      {entries.map((entry) => {
        const info = targetInfo[entry.target?.type]
        return (
          <li key={entry.id}>
            <span className={`${styles.activityDot} ${styles[`dot-${entry.tone}`] ?? ''}`} aria-hidden="true" />
            <div>
              <p>
                {entry.action}
                {showTarget && entry.target && (
                  <>
                    {' · '}
                    {info ? <Link to={info.path(entry.target)}>{entry.target.name}</Link> : entry.target.name}
                  </>
                )}
              </p>
              {entry.reason && <q>{entry.reason}</q>}
              <small>
                {entry.by} · {timeAgo(entry.date)}
              </small>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
