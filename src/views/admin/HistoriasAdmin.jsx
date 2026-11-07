import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SelectInput } from '../../components/forms/Field'
import { StatusPill } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Icon from '../../components/ui/Icon'
import { Tabs } from '../../components/ui/Navigation'
import { useFoundations } from '../../context/FoundationsContext'
import { useStories } from '../../context/StoriesContext'
import { storyFilters } from '../../data/stories'
import { formatDate } from '../../utils/dates'
import { formatNumber } from '../../utils/format'
import { isHidden } from '../../utils/moderation'
import { AdminHeader, EmptyRows, HiddenPill, SearchField, TableFooter } from './AdminParts'
import { matchesQuery, paginate, useListParams } from './adminData'
import { useModeration } from './useModeration'
import styles from './Admin.module.css'

const tabs = [
  { value: 'todas', label: 'Todas', test: () => true },
  { value: 'publicadas', label: 'Publicadas', test: (story) => !isHidden(story) },
  { value: 'retiradas', label: 'Retiradas', test: isHidden },
]

// Panel de administración · Historias de rescates y adopciones que se muestran en el sitio.
export default function HistoriasAdmin() {
  const { stories } = useStories()
  const { getFoundationById } = useFoundations()
  const moderation = useModeration()
  const list = useListParams('todas')
  const [dialog, setDialog] = useState(null)
  const typeFilter = list.get('tipo')
  const tab = tabs.find((item) => item.value === list.filter) ?? tabs[0]

  const rows = stories
    .filter(
      (story) =>
        tab.test(story) &&
        (!typeFilter || story.type === typeFilter) &&
        matchesQuery(list.query, story.title, story.label, getFoundationById(story.foundationId)?.name),
    )
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  const { page, totalPages, pageRows, from, to } = paginate(rows, list.page)

  function askHide(story) {
    setDialog({
      icon: 'eye-off',
      tone: 'danger',
      title: `Retirar “${story.title}”`,
      text: 'Deja de aparecer en Historias, en el inicio y en el perfil de la fundación. Puedes restaurarla cuando quieras.',
      reasonLabel: 'Motivo del retiro',
      reasonPlaceholder: 'Ej.: La familia adoptante pidió retirar las fotos de su casa.',
      confirmLabel: 'Retirar historia',
      onConfirm: ({ reason }) => moderation.hideStory(story, reason),
    })
  }

  return (
    <div className={styles.page}>
      <AdminHeader
        eyebrow="Publicaciones"
        title="Historias"
        text="Rescates, tratamientos y adopciones que inspiran a la comunidad. Retira las que tengan información sensible o que no se puedan verificar."
      />

      <section className={styles.card}>
        <Tabs
          label="Filtrar historias"
          variant="pills"
          value={tab.value}
          onChange={list.setFilter}
          tabs={tabs.map(({ value, label, test }) => ({ value, label, count: stories.filter(test).length }))}
        />
        <div className={styles.toolbar}>
          <SearchField value={list.query} onChange={list.setQuery} placeholder="Buscar por título o fundación" />
          <SelectInput
            icon="filter"
            aria-label="Filtrar por tipo de historia"
            value={typeFilter}
            onChange={(event) => list.set('tipo', event.target.value)}
          >
            <option value="">Todos los tipos</option>
            {storyFilters
              .filter((item) => item.value !== 'todas')
              .map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
          </SelectInput>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Historia</th>
                <th>Fundación</th>
                <th>Publicada</th>
                <th>Me gusta</th>
                <th>Estado</th>
                <th className={styles.alignEnd}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((story) => {
                const foundation = getFoundationById(story.foundationId)
                const hidden = isHidden(story)
                return (
                  <tr key={story.id}>
                    <td>
                      <div className={styles.cell}>
                        <img src={story.photo} alt="" />
                        <span className={styles.cellText}>
                          <strong>{story.title}</strong>
                          <small>{story.label}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      {foundation ? <Link to={`/admin/fundaciones/${foundation.id}`}>{foundation.name}</Link> : '—'}
                    </td>
                    <td>{formatDate(story.publishedAt, { year: true })}</td>
                    <td>{formatNumber(story.likes)}</td>
                    <td>
                      <span className={styles.stack}>
                        {hidden ? (
                          <HiddenPill moderation={story.moderation} label="Retirada" />
                        ) : (
                          <StatusPill tone="success" size="sm">
                            Publicada
                          </StatusPill>
                        )}
                        {hidden && story.moderation?.reason && <small className={styles.subtle}>{story.moderation.reason}</small>}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link className="icon-btn" to={`/historias/${story.id}`} aria-label={`Ver “${story.title}”`} title="Ver historia">
                          <Icon name="eye" />
                        </Link>
                        {hidden ? (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => moderation.restoreStory(story)}>
                            Restaurar
                          </button>
                        ) : (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => askHide(story)}>
                            Retirar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!pageRows.length && <EmptyRows text="No hay historias con estos filtros." />}
        </div>
        <TableFooter from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={list.setPage} />
      </section>

      <ConfirmDialog {...dialog} open={Boolean(dialog)} onClose={() => setDialog(null)} />
    </div>
  )
}
