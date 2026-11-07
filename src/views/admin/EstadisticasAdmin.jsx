import { useState } from 'react'
import AreaChart from '../../components/charts/AreaChart'
import BarChart from '../../components/charts/BarChart'
import ColumnChart from '../../components/charts/ColumnChart'
import DonutChart from '../../components/charts/DonutChart'
import StatTile from '../../components/cards/StatTile'
import Icon from '../../components/ui/Icon'
import { MAX_INTENTOS, useAnalitica } from '../../hooks/useAnalitica'
import { timeAgo } from '../../utils/dates'
import { formatCOP, formatNumber, plural } from '../../utils/format'
import { AdminHeader } from './AdminParts'
import styles from './Admin.module.css'

const percentFormat = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 0 })

// Las colecciones que calcula la API de Python, cada una con la forma que pide su dato:
//   area    → cambio en el tiempo (montaña)        donut → partes de un todo con pocas partes (torta)
//   columns → cantidades en un orden fijo           bars  → comparar cantidades de mayor a menor
// `ordered` conserva el orden de la API en la tabla (semanas, etapas). `empty` explica por qué una gráfica
// no tiene datos usando cuántos registros procesó (metadata), para no confundir "no hay datos" con "falló".
const charts = [
  {
    key: 'mascotasPorSemana',
    type: 'area',
    wide: true,
    ordered: true,
    title: 'Mascotas publicadas por semana',
    text: 'Cuántas mascotas publicaron las fundaciones cada semana.',
    tableHead: 'Semana',
    unit: ['mascota', 'mascotas'],
    empty: ({ mascotas }) =>
      mascotas ? 'Las mascotas no traen fecha de publicación.' : 'El backend todavía no tiene mascotas registradas.',
  },
  {
    key: 'mascotasPorEstadoAdopcion',
    type: 'donut',
    ordered: true,
    title: 'Estado de adopción de las mascotas',
    text: 'Cuántas siguen disponibles y cuántas ya encontraron hogar.',
    tableHead: 'Estado',
    unit: ['mascota', 'mascotas'],
    empty: ({ mascotas }) =>
      mascotas ? 'Las mascotas no traen estado de adopción.' : 'El backend todavía no tiene mascotas registradas.',
  },
  {
    key: 'solicitudesPorEstado',
    type: 'columns',
    ordered: true,
    title: 'Solicitudes de adopción por estado',
    text: 'En qué punto del proceso está cada solicitud.',
    tableHead: 'Estado',
    unit: ['solicitud', 'solicitudes'],
    empty: ({ solicitudes }) =>
      solicitudes ? 'Las solicitudes no traen estado.' : 'Todavía no hay solicitudes de adopción en el backend.',
  },
  {
    key: 'mascotasPorFundacion',
    type: 'bars',
    title: 'Mascotas por fundación',
    text: 'Cuántas mascotas publica cada fundación.',
    tableHead: 'Fundación',
    unit: ['mascota', 'mascotas'],
    empty: ({ mascotas }) =>
      mascotas ? 'Las mascotas no traen su fundación.' : 'El backend todavía no tiene mascotas registradas.',
  },
  {
    key: 'mascotasPorEspecie',
    type: 'columns',
    title: 'Mascotas por especie',
    text: 'Mascotas registradas en el backend.',
    tableHead: 'Especie',
    unit: ['mascota', 'mascotas'],
    empty: ({ mascotas }) => (mascotas ? 'Las mascotas no traen especie.' : 'El backend todavía no tiene mascotas registradas.'),
  },
  {
    key: 'solicitudesPorEspecie',
    type: 'bars',
    tableHead: 'Especie',
    title: 'Solicitudes de adopción por especie',
    text: 'Qué especies reciben más solicitudes.',
    unit: ['solicitud', 'solicitudes'],
    empty: ({ solicitudes }) =>
      solicitudes ? 'Las solicitudes no traen la especie de la mascota.' : 'Todavía no hay solicitudes de adopción en el backend.',
  },
  {
    key: 'favoritosPorEspecie',
    type: 'bars',
    tableHead: 'Especie',
    title: 'Favoritos por especie',
    text: 'Qué especies guardan más las personas.',
    unit: ['favorito', 'favoritos'],
    empty: ({ favoritos }) =>
      favoritos ? 'Los favoritos no traen la especie de la mascota.' : 'Nadie ha guardado favoritos todavía en el backend.',
  },
  {
    key: 'donacionesPorCampana',
    type: 'bars',
    tableHead: 'Campaña',
    title: 'Donaciones por campaña',
    text: 'Total donado a cada campaña.',
    money: true,
    empty: ({ donaciones }) =>
      donaciones ? 'Las donaciones no traen la campaña o el monto.' : 'Todavía no hay donaciones registradas en el backend.',
  },
]

// Tarjeta de una gráfica con su equivalente en tabla (accesible y útil para copiar los datos).
function ChartCard({ chart, data, procesados }) {
  const [showTable, setShowTable] = useState(false)
  const total = data.reduce((sum, row) => sum + row.value, 0)
  const format = chart.money ? formatCOP : formatNumber
  const summary = chart.money ? `${formatCOP(total)} en total` : `${plural(total, chart.unit[0], chart.unit[1])} en total`

  const rows = chart.ordered ? data : [...data].sort((a, b) => b.value - a.value)
  let graphic
  if (chart.type === 'area') graphic = <AreaChart data={data} format={format} label={chart.title} unit={chart.unit} />
  else if (chart.type === 'donut') graphic = <DonutChart data={data} format={format} label={chart.title} unit={chart.unit} />
  else if (chart.type === 'columns') graphic = <ColumnChart data={data} format={format} label={chart.title} />
  else graphic = <BarChart data={data} format={format} label={chart.title} />

  return (
    <section className={`${styles.card} ${chart.wide ? styles.chartWide : ''}`}>
      <div className={styles.cardHead}>
        <div>
          <h2>{chart.title}</h2>
          <p>{data.length ? `${chart.text} ${summary}.` : chart.text}</p>
        </div>
        {data.length > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-pressed={showTable}
            onClick={() => setShowTable((value) => !value)}
          >
            <Icon name={showTable ? 'trending-up' : 'list'} />
            {showTable ? 'Ver gráfica' : 'Ver tabla'}
          </button>
        )}
      </div>

      {!data.length ? (
        <p className={styles.chartEmpty}>
          <Icon name="info" />
          {chart.empty(procesados)}
        </p>
      ) : showTable ? (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">{chart.tableHead ?? 'Categoría'}</th>
              <th scope="col">{chart.money ? 'Total' : 'Cantidad'}</th>
              <th scope="col">Del total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{format(row.value)}</td>
                <td>{percentFormat.format(total ? row.value / total : 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        graphic
      )}
    </section>
  )
}

// Panel de administración · Estadísticas: gráficas con los datos que calcula la API de analítica en Python.
export default function EstadisticasAdmin() {
  const { datos, actualizado, cargando, error, intento, actualizar } = useAnalitica()
  const procesados = datos?.procesados

  return (
    <div className={styles.page}>
      <AdminHeader
        eyebrow="Seguimiento"
        title="Estadísticas"
        text="Datos reales del backend, procesados con pandas por la API de analítica en Python. No incluyen los cambios que se hacen en la demostración local."
      >
        <button type="button" className="btn btn-secondary" onClick={actualizar} disabled={cargando}>
          <Icon name="refresh-cw" />
          {cargando ? 'Actualizando…' : 'Actualizar datos'}
        </button>
      </AdminHeader>

      <p className={styles.sourceLine} role="status">
        <Icon name={error ? 'alert-circle' : cargando ? 'clock' : 'check-circle'} />
        {cargando
          ? intento > 1
            ? `Encendiendo los servicios de analítica… intento ${intento} de ${MAX_INTENTOS}. La primera consulta puede tardar hasta un minuto.`
            : 'Consultando la API de analítica…'
          : error
            ? 'No pudimos consultar la API de analítica.'
            : `Fuente: Spring Boot → API de Python (pandas) · actualizado ${timeAgo(actualizado)}`}
      </p>

      {error && (
        <div className="alert alert-error" role="alert">
          <Icon name="alert-circle" />
          <div className={styles.alertBody}>
            <strong>{datos ? 'No pudimos actualizar las estadísticas' : 'No pudimos cargar las estadísticas'}</strong>
            <span>
              {datos ? `Mostramos los datos de ${timeAgo(actualizado)}. ` : ''}
              Puede que el backend o la API de Python estén apagados. Detalle: {error}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={actualizar}>
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!datos && cargando && (
        <section className={`${styles.card} ${styles.loadingCard}`} aria-busy="true">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <strong>Preparando las gráficas</strong>
            <p className={styles.mutedText}>
              Spring Boot le pide los datos a la API de Python, que consulta el backend, los limpia con pandas y los
              agrupa. Si los servicios estaban apagados, la primera consulta tarda más.
            </p>
          </div>
        </section>
      )}

      {datos && (
        // Al actualizar se conservan las gráficas anteriores, atenuadas, en vez de vaciar la pantalla.
        <div className={`${styles.statsContent} ${cargando ? styles.refreshing : ''}`} aria-busy={cargando}>
          <div className={styles.kpis}>
            <StatTile icon="paw" tone="primary" label="Mascotas analizadas" value={formatNumber(procesados.mascotas)} />
            <StatTile icon="heart" tone="accent" label="Campañas analizadas" value={formatNumber(procesados.campanas)} />
            <StatTile icon="file" tone="info" label="Solicitudes analizadas" value={formatNumber(procesados.solicitudes)} />
            <StatTile icon="credit-card" tone="purple" label="Donaciones analizadas" value={formatNumber(procesados.donaciones)} />
            <StatTile icon="star" tone="warning" label="Favoritos analizados" value={formatNumber(procesados.favoritos)} />
          </div>

          <div className={styles.chartGrid}>
            {charts.map((chart) => (
              <ChartCard key={chart.key} chart={chart} data={datos[chart.key]} procesados={procesados} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
