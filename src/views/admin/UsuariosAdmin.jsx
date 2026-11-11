import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar'
import { StatusPill } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Icon from '../../components/ui/Icon'
import { Tabs } from '../../components/ui/Navigation'
import { useAdoptions } from '../../context/AdoptionsContext'
import { useAuth } from '../../context/AuthContext'
import { useDonations } from '../../context/DonationsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { verificationOf, verificationStatuses } from '../../data/foundations'
import { accountTypeLabels, fullName } from '../../data/users'
import { useUsuariosServidor } from '../../hooks/useUsuariosServidor'
import { formatDate } from '../../utils/dates'
import { plural } from '../../utils/format'
import { AdminHeader, EmptyRows, SearchField, TableFooter } from './AdminParts'
import { matchesQuery, paginate, useListParams } from './adminData'
import { useModeration } from './useModeration'
import styles from './Admin.module.css'

const tabs = [
  { value: 'todas', label: 'Todas', test: () => true },
  { value: 'personas', label: 'Personas', test: (account) => account.accountType === 'persona' },
  { value: 'fundaciones', label: 'Fundaciones', test: (account) => account.accountType === 'fundacion' },
  { value: 'administradores', label: 'Administradores', test: (account) => account.accountType === 'admin' },
  { value: 'suspendidas', label: 'Suspendidas', test: (account) => Boolean(account.suspended) },
]

const typeTones = { persona: 'primary', fundacion: 'info', admin: 'purple' }

// Panel de administración · Cuentas de la plataforma: suspender y reactivar.
export default function UsuariosAdmin() {
  const { user, users } = useAuth()
  const { getFoundationById } = useFoundations()
  const { requests } = useAdoptions()
  const { donations } = useDonations()
  const servidor = useUsuariosServidor()
  const moderation = useModeration()
  const list = useListParams('todas')
  const [dialog, setDialog] = useState(null)
  const tab = tabs.find((item) => item.value === list.filter) ?? tabs[0]

  // Cuentas de la demostración local + las del backend que este navegador no tiene guardadas (una persona que
  // se registró desde otro equipo). Si la cuenta del backend ya inició sesión aquí, se usa la copia local,
  // que es la que guarda la suspensión.
  const localIds = new Set(users.map((account) => account.id))
  const accounts = [
    ...users,
    ...servidor.users.filter((account) => !localIds.has(account.id)).map((account) => ({ ...account, serverOnly: true })),
  ]

  const rows = accounts
    .filter(
      (account) =>
        tab.test(account) &&
        matchesQuery(list.query, fullName(account), account.email, account.city, account.representative, account.nit),
    )
    .sort((a, b) => Number(Boolean(b.suspended)) - Number(Boolean(a.suspended)) || new Date(b.createdAt) - new Date(a.createdAt))
  const { page, totalPages, pageRows, from, to } = paginate(rows, list.page)

  function askSuspend(account) {
    setDialog({
      icon: 'lock',
      tone: 'danger',
      title: `Suspender la cuenta de ${fullName(account) || account.email}`,
      text:
        account.accountType === 'fundacion'
          ? 'La fundación no podrá iniciar sesión ni gestionar sus publicaciones. Para quitarla del directorio, suspende también la fundación.'
          : 'La persona no podrá iniciar sesión, enviar solicitudes de adopción ni donar con su cuenta.',
      reasonLabel: 'Motivo de la suspensión',
      reasonPlaceholder: 'Ej.: Varias fundaciones reportaron mensajes ofensivos durante las entrevistas.',
      confirmLabel: 'Suspender cuenta',
      onConfirm: ({ reason }) => moderation.suspendUser(account, reason),
    })
  }

  // Resumen corto de lo que la cuenta hace en PetMind.
  function activity(account) {
    if (account.accountType === 'persona') {
      const local = requests.filter((request) => request.userId === account.id && request.stage !== 'borrador').length
      const sent = local + (account.backendId == null ? 0 : (servidor.requestsByUser.get(account.backendId) ?? 0))
      const given = donations.filter((donation) => donation.userId === account.id && donation.status === 'aprobada').length
      return `${plural(sent, 'solicitud', 'solicitudes')} · ${plural(given, 'donación', 'donaciones')}`
    }
    if (account.accountType === 'fundacion' && account.source === 'backend') {
      return account.foundationName ? `Representa a ${account.foundationName}` : 'Representante de una fundación del backend'
    }
    if (account.accountType === 'fundacion') {
      const foundation = getFoundationById(account.foundationId)
      if (!foundation) return 'Sin fundación asociada'
      return (
        <Link to={`/admin/fundaciones/${foundation.id}`}>
          {foundation.name} · {verificationStatuses[verificationOf(foundation)].short.toLowerCase()}
        </Link>
      )
    }
    return 'Equipo PetMind'
  }

  return (
    <div className={styles.page}>
      <AdminHeader
        title="Usuarios"
        text="Personas, fundaciones y administradores registrados, en la demostración local y en el backend. Una cuenta suspendida no puede iniciar sesión hasta que la reactives."
      />

      <p className={styles.sourceLine} role="status">
        <Icon name={servidor.status === 'error' ? 'alert-circle' : servidor.status === 'loading' ? 'clock' : 'check-circle'} />
        {servidor.status === 'loading'
          ? 'Cargando las cuentas registradas en el backend…'
          : servidor.status === 'error'
            ? 'No pudimos cargar las cuentas del backend; se muestran solo las de la demostración local.'
            : `Incluye ${plural(servidor.users.length, 'cuenta registrada', 'cuentas registradas')} en el backend.`}
        {servidor.status === 'error' && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={servidor.retry}>
            Reintentar
          </button>
        )}
      </p>

      <section className={styles.card}>
        <Tabs
          label="Filtrar cuentas"
          variant="pills"
          value={tab.value}
          onChange={list.setFilter}
          tabs={tabs.map(({ value, label, test }) => ({ value, label, count: accounts.filter(test).length }))}
        />
        <div className={styles.toolbar}>
          <SearchField value={list.query} onChange={list.setQuery} placeholder="Buscar por nombre, correo o ciudad" />
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Tipo</th>
                <th>Ciudad</th>
                <th>Registro</th>
                <th>Actividad</th>
                <th>Estado</th>
                <th className={styles.alignEnd}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((account) => {
                const name = fullName(account) || account.email
                const isSelf = account.id === user.id
                return (
                  <tr key={account.id}>
                    <td>
                      <div className={styles.cell}>
                        <Avatar name={name} src={account.avatar} color={typeTones[account.accountType] ?? 'primary'} size="sm" />
                        <span className={styles.cellText}>
                          <strong>
                            {name}
                            {isSelf ? ' (tú)' : ''}
                          </strong>
                          <small>{account.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.stack}>
                        <StatusPill tone={typeTones[account.accountType] ?? 'neutral'} size="sm" dot={false}>
                          {accountTypeLabels[account.accountType] ?? account.accountType}
                        </StatusPill>
                        {account.source === 'backend' && <small className={styles.subtle}>Backend</small>}
                      </span>
                    </td>
                    <td>{account.city || '—'}</td>
                    <td>{account.createdAt ? formatDate(account.createdAt, { year: true }) : '—'}</td>
                    <td>
                      <span className={styles.subtle}>{activity(account)}</span>
                    </td>
                    <td>
                      <span className={styles.stack}>
                        {account.suspended ? (
                          <StatusPill tone="danger" size="sm">
                            Suspendida
                          </StatusPill>
                        ) : account.emailVerified ? (
                          <StatusPill tone="success" size="sm">
                            Activa
                          </StatusPill>
                        ) : (
                          <StatusPill tone="warning" size="sm">
                            Correo sin verificar
                          </StatusPill>
                        )}
                        {account.suspended && account.suspension?.reason && (
                          <small className={styles.subtle}>{account.suspension.reason}</small>
                        )}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {isSelf ? (
                          <span className={styles.subtle}>Tu cuenta</span>
                        ) : account.serverOnly ? (
                          // El backend todavía no tiene suspensión de cuentas: no se ofrece una acción que no se guardaría.
                          <span className={styles.subtle} title="La suspensión de cuentas todavía no existe en el backend.">
                            Sin acciones
                          </span>
                        ) : account.suspended ? (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => moderation.reactivateUser(account)}>
                            Reactivar
                          </button>
                        ) : (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => askSuspend(account)}>
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!pageRows.length && <EmptyRows text="Prueba con otro nombre o correo." />}
        </div>
        <TableFooter from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={list.setPage} />
      </section>

      <ConfirmDialog {...dialog} open={Boolean(dialog)} onClose={() => setDialog(null)} />
    </div>
  )
}
