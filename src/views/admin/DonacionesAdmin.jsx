import { Link } from 'react-router-dom'
import StatTile from '../../components/cards/StatTile'
import { SelectInput } from '../../components/forms/Field'
import { StatusPill } from '../../components/ui/Badges'
import Icon from '../../components/ui/Icon'
import { Tabs } from '../../components/ui/Navigation'
import { useCampaigns } from '../../context/CampaignsContext'
import { useDonations } from '../../context/DonationsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { formatDateTime } from '../../utils/dates'
import { downloadTextFile, formatCOP, formatCOPShort } from '../../utils/format'
import { AdminHeader, EmptyRows, SearchField, TableFooter } from './AdminParts'
import { matchesQuery, paginate, useListParams } from './adminData'
import styles from './Admin.module.css'

const FUND = 'fondo-petmind'
// Marca de orden de bytes: hace que Excel abra el CSV con las tildes bien.
const BOM = String.fromCharCode(0xfeff)

const tabs = [
  { value: 'todas', label: 'Todas', test: () => true },
  { value: 'aprobadas', label: 'Aprobadas', test: (donation) => donation.status === 'aprobada' },
  { value: 'rechazadas', label: 'Rechazadas', test: (donation) => donation.status === 'rechazada' },
  { value: 'mensuales', label: 'Mensuales activas', test: (donation) => donation.frequency === 'mensual' && donation.subscription === 'activa' },
]

const methodLabels = { tarjeta: 'Tarjeta', pse: 'PSE', billetera: 'Billetera digital' }
const sum = (items, field) => items.reduce((total, item) => total + (Number(item[field]) || 0), 0)

// Comas o comillas dentro de un campo romperían las columnas del CSV.
function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Panel de administración · Donaciones: libro de todas las donaciones de la plataforma (solo lectura).
export default function DonacionesAdmin() {
  const { donations } = useDonations()
  const { getCampaignById } = useCampaigns()
  const { foundations, getFoundationById } = useFoundations()
  const list = useListParams('todas')
  const foundationFilter = list.get('fundacion')
  const tab = tabs.find((item) => item.value === list.filter) ?? tabs[0]

  // El Fondo PetMind no pertenece a una fundación: se filtra con su propio valor.
  const foundationOf = (donation) => (donation.campaignId === FUND ? FUND : getCampaignById(donation.campaignId)?.foundationId)
  const donorName = (donation) => (donation.anonymous ? 'Anónimo' : donation.donorName || 'Sin nombre')

  const rows = donations
    .filter((donation) => {
      const campaign = getCampaignById(donation.campaignId)
      return (
        tab.test(donation) &&
        (!foundationFilter || foundationOf(donation) === foundationFilter) &&
        matchesQuery(list.query, donation.id, donation.donorName, donation.email, campaign?.title)
      )
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const { page, totalPages, pageRows, from, to } = paginate(rows, list.page)

  const approved = donations.filter((donation) => donation.status === 'aprobada')
  const rejected = donations.filter((donation) => donation.status === 'rechazada')

  function exportCsv() {
    const header = ['Referencia', 'Fecha', 'Donante', 'Correo', 'Campaña', 'Fundación', 'Monto', 'Aporte a la plataforma', 'Total', 'Frecuencia', 'Método', 'Estado']
    const lines = rows.map((donation) => {
      const campaign = getCampaignById(donation.campaignId)
      const foundationId = foundationOf(donation)
      return [
        donation.id,
        new Date(donation.date).toISOString(),
        donorName(donation),
        donation.anonymous ? '' : donation.email,
        campaign?.title ?? donation.campaignId,
        foundationId === FUND ? 'Fondo PetMind' : (getFoundationById(foundationId)?.name ?? ''),
        donation.amount,
        donation.fee ?? 0,
        donation.total ?? donation.amount,
        donation.frequency === 'mensual' ? 'Mensual' : 'Una vez',
        methodLabels[donation.method] ?? donation.method,
        donation.status,
      ]
        .map(csvCell)
        .join(',')
    })
    downloadTextFile(`donaciones-petmind-${new Date().toISOString().slice(0, 10)}.csv`, `${BOM}${[header.join(','), ...lines].join('\n')}`, 'text/csv;charset=utf-8')
  }

  return (
    <div className={styles.page}>
      <AdminHeader
        eyebrow="Seguimiento"
        title="Donaciones"
        text="Todas las donaciones hechas en PetMind. Los donantes anónimos se muestran sin nombre ni correo."
      >
        <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={!rows.length}>
          <Icon name="download" />
          Exportar CSV
        </button>
      </AdminHeader>

      <div className={styles.stats}>
        <StatTile icon="heart" tone="accent" label="Recaudado (donaciones aprobadas)" value={formatCOPShort(sum(approved, 'amount'))} />
        <StatTile icon="star" tone="purple" label="Aportes a los costos de la plataforma" value={formatCOPShort(sum(approved, 'fee'))} />
        <StatTile icon="check-circle" tone="primary" label="Donaciones aprobadas" value={approved.length} />
        <StatTile icon="alert-circle" tone="warning" label="Pagos rechazados" value={rejected.length} />
      </div>

      <section className={styles.card}>
        <Tabs
          label="Filtrar donaciones"
          variant="pills"
          value={tab.value}
          onChange={list.setFilter}
          tabs={tabs.map(({ value, label, test }) => ({ value, label, count: donations.filter(test).length }))}
        />
        <div className={styles.toolbar}>
          <SearchField value={list.query} onChange={list.setQuery} placeholder="Buscar por referencia, donante o campaña" />
          <SelectInput
            icon="building"
            aria-label="Filtrar por fundación"
            value={foundationFilter}
            onChange={(event) => list.set('fundacion', event.target.value)}
          >
            <option value="">Todas las fundaciones</option>
            <option value={FUND}>Fondo PetMind</option>
            {foundations
              .filter((foundation) => donations.some((donation) => foundationOf(donation) === foundation.id))
              .map((foundation) => (
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
                <th>Referencia</th>
                <th>Donante</th>
                <th>Campaña</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((donation) => {
                const campaign = getCampaignById(donation.campaignId)
                const foundationId = foundationOf(donation)
                const foundationName = foundationId === FUND ? 'Fondo PetMind' : getFoundationById(foundationId)?.name
                return (
                  <tr key={donation.id}>
                    <td>
                      <span className={styles.stack}>
                        <strong>{donation.id}</strong>
                        <small className={styles.subtle}>{formatDateTime(donation.date)}</small>
                      </span>
                    </td>
                    <td>
                      <span className={styles.stack}>
                        <span>{donorName(donation)}</span>
                        {!donation.anonymous && donation.email && <small className={styles.subtle}>{donation.email}</small>}
                      </span>
                    </td>
                    <td>
                      <span className={styles.stack}>
                        {campaign ? <Link to={`/donar/${campaign.id}`}>{campaign.title}</Link> : <span>{donation.campaignId}</span>}
                        {foundationName && <small className={styles.subtle}>{foundationName}</small>}
                      </span>
                    </td>
                    <td>
                      <span className={styles.stack}>
                        <strong>{formatCOP(donation.amount)}</strong>
                        {Number(donation.fee) > 0 && <small className={styles.subtle}>+ {formatCOP(donation.fee)} para la plataforma</small>}
                      </span>
                    </td>
                    <td>
                      <span className={styles.stack}>
                        <span>{donation.methodLabel ?? methodLabels[donation.method] ?? donation.method}</span>
                        <small className={styles.subtle}>{donation.frequency === 'mensual' ? 'Mensual' : 'Una vez'}</small>
                      </span>
                    </td>
                    <td>
                      <StatusPill tone={donation.status === 'aprobada' ? 'success' : 'danger'} size="sm">
                        {donation.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                      </StatusPill>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!pageRows.length && <EmptyRows text="No hay donaciones con estos filtros." />}
        </div>
        <TableFooter from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={list.setPage} />
      </section>
    </div>
  )
}
