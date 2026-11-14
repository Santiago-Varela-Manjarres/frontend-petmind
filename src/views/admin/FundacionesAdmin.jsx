import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar'
import { StatusPill } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Tabs } from '../../components/ui/Navigation'
import { useAuth } from '../../context/AuthContext'
import { useCampaigns } from '../../context/CampaignsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { verificationOf, verificationStatuses } from '../../data/foundations'
import { formatDate } from '../../utils/dates'
import { plural } from '../../utils/format'
import { AdminHeader, EmptyRows, SearchField, TableFooter } from './AdminParts'
import { matchesQuery, paginate } from '../../utils/listas'
import { useListParams } from './adminData'
import { foundationDialog } from './dialogs'
import { useModeration } from './useModeration'
import styles from './Admin.module.css'

const tabs = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'verificada', label: 'Verificadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'suspendida', label: 'Suspendidas' },
]

// Primero lo que necesita una decisión; dentro de cada estado, lo que lleva más tiempo esperando.
const statusOrder = { pendiente: 0, rechazada: 1, suspendida: 2, verificada: 3 }
const waitingSince = (foundation) => new Date(foundation.verification?.date ?? foundation.createdAt ?? 0)

// Panel de administración · Fundaciones: verificar, rechazar, suspender y reactivar.
export default function FundacionesAdmin() {
  const { users } = useAuth()
  const { foundations } = useFoundations()
  const { pets } = usePets()
  const { campaigns } = useCampaigns()
  const moderation = useModeration()
  const list = useListParams('todas')
  const [dialog, setDialog] = useState(null)

  const rows = foundations
    .map((foundation) => ({
      foundation,
      status: verificationOf(foundation),
      account: users.find((item) => item.foundationId === foundation.id),
    }))
    .filter(
      ({ foundation, status, account }) =>
        (list.filter === 'todas' || status === list.filter) &&
        matchesQuery(
          list.query,
          foundation.name,
          foundation.city,
          foundation.nit ?? account?.nit,
          foundation.contact?.email,
          account?.email,
          account?.representative,
        ),
    )
    .sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] ||
        waitingSince(a.foundation) - waitingSince(b.foundation) ||
        a.foundation.name.localeCompare(b.foundation.name, 'es'),
    )
  const { page, totalPages, pageRows, from, to } = paginate(rows, list.page)
  const countFor = (value) =>
    value === 'todas' ? foundations.length : foundations.filter((foundation) => verificationOf(foundation) === value).length

  function decide(kind, foundation, status) {
    setDialog(foundationDialog(kind, foundation, status, moderation))
  }

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Fundaciones"
        text="Revisa los documentos de cada organización antes de verificarla. Solo las verificadas salen en el directorio y reciben reportes."
      />

      <section className={styles.card}>
        <Tabs
          label="Filtrar fundaciones por estado"
          variant="pills"
          value={list.filter}
          onChange={list.setFilter}
          tabs={tabs.map((tab) => ({ ...tab, count: countFor(tab.value) }))}
        />
        <div className={styles.toolbar}>
          <SearchField
            value={list.query}
            onChange={list.setQuery}
            placeholder="Buscar por nombre, ciudad, NIT o correo"
          />
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fundación</th>
                <th>NIT</th>
                <th>Representante</th>
                <th>Registro</th>
                <th>Publicaciones</th>
                <th>Estado</th>
                <th className={styles.alignEnd}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ foundation, status, account }) => {
                const info = verificationStatuses[status]
                const petCount = pets.filter((pet) => pet.foundationId === foundation.id).length
                const campaignCount = campaigns.filter((campaign) => campaign.foundationId === foundation.id).length
                return (
                  <tr key={foundation.id}>
                    <td>
                      <div className={styles.cell}>
                        <Avatar name={foundation.name} initials={foundation.initials} color={foundation.color} size="sm" />
                        <span className={styles.cellText}>
                          <Link to={`/admin/fundaciones/${foundation.id}`}>
                            <strong>{foundation.name}</strong>
                          </Link>
                          <small>
                            {foundation.city}
                            {foundation.department ? `, ${foundation.department}` : ''}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td className={styles.nowrap}>{foundation.nit ?? account?.nit ?? '—'}</td>
                    <td>
                      <span className={styles.stack}>
                        <span>{account?.representative ?? '—'}</span>
                        <small className={styles.subtle}>{account?.email ?? foundation.contact?.email}</small>
                      </span>
                    </td>
                    <td>{foundation.createdAt ? formatDate(foundation.createdAt, { year: true }) : `Desde ${foundation.since}`}</td>
                    <td>
                      <span className={styles.subtle}>
                        {plural(petCount, 'mascota')} · {plural(campaignCount, 'campaña')}
                      </span>
                    </td>
                    <td>
                      <StatusPill tone={info.tone} size="sm">
                        {info.short}
                      </StatusPill>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link className="btn btn-secondary btn-sm" to={`/admin/fundaciones/${foundation.id}`}>
                          {status === 'pendiente' ? 'Revisar' : 'Ver detalle'}
                        </Link>
                        {status === 'pendiente' && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => decide('rechazar', foundation, status)}>
                            Rechazar
                          </button>
                        )}
                        {status === 'verificada' && (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => decide('suspender', foundation, status)}>
                            Suspender
                          </button>
                        )}
                        {status !== 'verificada' && (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => decide('verificar', foundation, status)}>
                            {status === 'suspendida' ? 'Reactivar' : 'Verificar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!pageRows.length && (
            <EmptyRows text={list.query ? 'Prueba con otro nombre, ciudad o NIT.' : 'No hay fundaciones en este estado.'} />
          )}
        </div>
        <TableFooter from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={list.setPage} />
      </section>

      <ConfirmDialog {...dialog} open={Boolean(dialog)} onClose={() => setDialog(null)} />
    </div>
  )
}
