import StatTile from '../../../components/cards/StatTile'
import { formatDate } from '../../../utils/dates'
import { formatCOP } from '../../../utils/format'
import Empty from './Empty'
import styles from '../Fundacion.module.css'

// Donaciones aprobadas que recibió la fundación y total del mes en curso.
export default function DonationsPanel({ donations, campaigns }) {
  const month = new Date().getMonth()
  const year = new Date().getFullYear()
  const monthly = donations
    .filter((item) => {
      const date = new Date(item.date)
      return date.getMonth() === month && date.getFullYear() === year
    })
    .reduce((sum, item) => sum + item.amount, 0)
  return (
    <>
      <StatTile icon="heart" label="Total recibido este mes" value={formatCOP(monthly)} />
      <section className={styles.card}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Campaña</th>
                <th>Donante</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date, { year: true })}</td>
                  <td>{campaigns.find((campaign) => campaign.id === item.campaignId)?.title || 'Campaña'}</td>
                  <td>{item.anonymous ? 'Anónimo' : item.donorName || 'Donante'}</td>
                  <td>{formatCOP(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!donations.length && <Empty text="Cuando recibas aportes aprobados, aparecerán aquí." />}
        </div>
      </section>
    </>
  )
}
