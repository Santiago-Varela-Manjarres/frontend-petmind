import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatTile from '../../../components/cards/StatTile'
import Avatar from '../../../components/ui/Avatar'
import { StatusPill } from '../../../components/ui/Badges'
import { SegmentedControl } from '../../../components/ui/Controls'
import Icon from '../../../components/ui/Icon'
import { stageLabels } from '../../../data/adoptions'
import { campaignGoal } from '../../../data/campaigns'
import { monthlyDonationCounts, monthlyDonationsByFoundation } from '../../../data/donations'
import { foundationAttention } from '../../../data/institutional'
import { adoptableStatuses } from '../../../data/pets'
import { formatWeekdayDate, monthShortName, timeAgo } from '../../../utils/dates'
import { formatCOP, formatCOPShort } from '../../../utils/format'
import Empty from './Empty'
import styles from '../Fundacion.module.css'

// Resumen del panel: indicadores, gráfico de donaciones, solicitudes recientes, campañas y agenda.
export default function DashboardSummary({ foundation, ownRequests, ownPets, activeCampaigns, latest }) {
  const [range, setRange] = useState(6)
  const [today] = useState(() => new Date())
  const values = monthlyDonationsByFoundation[foundation?.id] || []
  const counts = monthlyDonationCounts[foundation?.id] || []
  const months = Array.from({ length: 12 }, (_, index) => monthShortName((today.getMonth() - (11 - index) + 12) % 12))
  const start = Math.max(0, 12 - range)
  const chartValues = values.slice(start)
  const max = 8
  const thisMonth = 11
  const nextWeek = new Date(today.getTime() + 7 * 86400000)
  const scheduled = ownRequests
    .filter(
      (request) =>
        ['entrevista', 'visita', 'aprobada'].includes(request.stage) &&
        (request.interview?.date || request.visit?.date || request.delivery?.date),
    )
    .map((request) => ({
      request,
      date: new Date(request.interview?.date || request.visit?.date || request.delivery?.date),
    }))
    .filter((item) => item.date >= today && item.date <= nextWeek)
    .sort((a, b) => a.date - b.date)
  const donationsThisMonth = (values[thisMonth] || 0) * 1000000
  return (
    <>
      <div className={styles.stats}>
        <StatTile
          icon="file"
          tone="info"
          label="Solicitudes nuevas"
          value={ownRequests.filter((item) => ['nueva', 'revision'].includes(item.stage)).length}
          delta="+3 hoy"
        />
        <StatTile
          icon="paw"
          tone="primary"
          label="Mascotas publicadas"
          value={ownPets.filter((pet) => adoptableStatuses.includes(pet.status)).length}
          delta="+2 esta semana"
        />
        <StatTile
          icon="heart"
          tone="accent"
          label={`Donaciones en ${months[thisMonth]}`}
          value={formatCOPShort(donationsThisMonth)}
          delta="+11%"
        />
        <StatTile
          icon="home"
          tone="purple"
          label={`Adopciones en ${today.getFullYear()}`}
          value={ownRequests.filter((item) => item.stage === 'aprobada').length}
          delta="+4"
        />
      </div>
      <section className={styles.card}>
        <div className={styles.sectionHead}>
          <div>
            <h2>Donaciones recibidas por mes</h2>
            <p>
              Millones de pesos · {months[start]} a {months[11]} de {today.getFullYear()}
            </p>
          </div>
          <SegmentedControl
            label="Periodo del gráfico"
            options={[
              { value: 3, label: '3 meses' },
              { value: 6, label: '6 meses' },
              { value: 12, label: 'Año' },
            ]}
            value={range}
            onChange={setRange}
            size="sm"
            fullWidth={false}
          />
        </div>
        <div className={styles.chart}>
          <div className={styles.chartAxis}>
            {[8, 6, 4, 2, 0].map((value) => (
              <span key={value}>${value}M</span>
            ))}
          </div>
          <div className={styles.chartPlot}>
            {[0, 2, 4, 6, 8].map((value) => (
              <i key={value} style={{ bottom: `${(value / max) * 100}%` }} />
            ))}
            {chartValues.map((value, index) => {
              const month = start + index
              const current = month === 11
              return (
                <div className={styles.barColumn} key={`${month}-${index}`}>
                  <div
                    className={`${styles.bar} ${current ? styles.barCurrent : ''}`}
                    style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
                    tabIndex="0"
                    title={`${formatCOP(value * 1000000)} · ${months[month]} · ${counts[month] || 0} donaciones`}
                  >
                    <span>{formatCOPShort(value * 1000000)}</span>
                    <b>
                      {formatCOP(value * 1000000)} · {months[month]} · {counts[month] || 0} donaciones
                    </b>
                  </div>
                  <small>{months[month]}</small>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <div className={styles.columns}>
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <h2>Solicitudes recientes</h2>
            <Link to="/fundacion/solicitudes">
              Ver todas <Icon name="arrow-right" />
            </Link>
          </div>
          {latest.slice(0, 4).map((request) => {
            const pet = ownPets.find((item) => item.id === request.petId)
            return (
              <Link className={styles.recent} to={`/fundacion/solicitudes/${request.id}`} key={request.id}>
                <Avatar
                  name={request.applicant?.name}
                  initials={request.applicant?.initials}
                  color={request.applicant?.color}
                  size="sm"
                />
                <span>
                  <strong>
                    {request.applicant?.name} → {pet?.name || request.petId}
                  </strong>
                  <small>{timeAgo(request.updatedAt || request.createdAt)}</small>
                </span>
                <StatusPill
                  tone={request.stage === 'entrevista' ? 'warning' : request.stage === 'nueva' ? 'info' : 'neutral'}
                >
                  {stageLabels[request.stage]}
                </StatusPill>
              </Link>
            )
          })}
        </section>
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <h2>Calidad del perfil público</h2>
            <Link to={`/fundaciones/${foundation?.id}`}>
              Ver perfil <Icon name="arrow-right" />
            </Link>
          </div>
          <div className={styles.progress}>
            <span style={{ width: '78%' }} />
          </div>
          <strong>78% completo</strong>
          <p>Agrega fotos y documentos recientes para que las familias conozcan mejor tu trabajo.</p>
          <Link className="btn btn-secondary btn-sm" to="/fundacion/documentos">
            Revisar documentos
          </Link>
        </section>
      </div>
      <div className={styles.columns}>
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <h2>Campañas activas</h2>
            <Link to="/fundacion/campanas">Gestionar</Link>
          </div>
          {activeCampaigns.slice(0, 3).map((campaign) => {
            const goal = campaignGoal(campaign)
            const percent = goal ? Math.min(100, (campaign.raised / goal) * 100) : 0
            return (
              <div className={styles.campaignProgress} key={campaign.id}>
                <div>
                  <strong>{campaign.title}</strong>
                  <span>
                    {Math.round(percent)}% · {formatCOP(campaign.raised)} de {formatCOP(goal)}
                  </span>
                </div>
                <div className={styles.progress}>
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            )
          })}
          {!activeCampaigns.length && <Empty text="No tienes campañas activas." />}
        </section>
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <h2>Agenda de la semana</h2>
            <Link to="/fundacion/solicitudes">Calendario</Link>
          </div>
          {scheduled.length ? (
            scheduled.slice(0, 4).map(({ request, date }, index) => (
              <div className={styles.agendaRow} key={request.id}>
                <time className={index === 0 ? styles.agendaToday : ''}>
                  <strong>{date.getDate()}</strong>
                  <small>{date.toLocaleDateString('es-CO', { weekday: 'short' }).toUpperCase()}</small>
                </time>
                <span>
                  <strong>{request.applicant?.name}</strong>
                  <small>
                    {stageLabels[request.stage]} · {formatWeekdayDate(date)}
                  </small>
                </span>
              </div>
            ))
          ) : (
            <Empty text="No hay entrevistas o visitas programadas para esta semana." />
          )}
        </section>
        <section className={styles.card}>
          <div className={styles.sectionHead}>
            <h2>Necesitan atención</h2>
            <Link to="/fundacion/reportes">Ver todo</Link>
          </div>
          {foundationAttention.map((item) => (
            <Link
              className={styles.attentionRow}
              to={
                item.to.includes('/editar')
                  ? `/fundacion/mascotas/${ownPets.find((pet) => pet.name.toLowerCase() === 'max')?.id || 'max'}/editar`
                  : item.to
              }
              key={item.id}
            >
              {item.photo && <img src={item.photo} alt="" />}
              <span>
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </span>
              <Icon name="chevron-right" />
            </Link>
          ))}
        </section>
      </div>
    </>
  )
}
