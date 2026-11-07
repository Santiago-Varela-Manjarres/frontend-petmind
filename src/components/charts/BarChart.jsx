import styles from './BarChart.module.css'

const percentFormat = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 0 })

// Agrupa la cola en "Otras" cuando hay más categorías de las que se leen bien de un vistazo.
function withOthers(rows, max, otherLabel) {
  if (rows.length <= max) return rows
  const rest = rows.slice(max - 1)
  return [
    ...rows.slice(0, max - 1),
    { label: `${otherLabel} (${rest.length})`, value: rest.reduce((total, row) => total + row.value, 0), other: true },
  ]
}

// Barras horizontales de mayor a menor, de una sola serie (el título de la tarjeta dice qué se mide,
// así que no lleva leyenda). Hecho con HTML y CSS, sin librerías. Cada fila muestra su valor al final
// de la barra; al pasar el mouse o con el teclado se ve además el porcentaje del total.
// data: [{ label, value }] · format: cómo escribir el valor · label: nombre accesible del gráfico
export default function BarChart({ data, format = (value) => value, label, max = 8, otherLabel = 'Otras' }) {
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const rows = withOthers(sorted, max, otherLabel)
  const total = sorted.reduce((sum, row) => sum + row.value, 0)
  const top = Math.max(0, ...rows.map((row) => row.value))

  return (
    <ul className={styles.chart} aria-label={label}>
      {rows.map((row) => {
        const share = total ? row.value / total : 0
        const description = `${row.label}: ${format(row.value)}, ${percentFormat.format(share)} del total`
        return (
          <li key={row.label} className={styles.row}>
            <span className={styles.label} aria-hidden="true">
              {row.label}
            </span>
            <span className={styles.track}>
              <span
                className={`${styles.bar} ${row.other ? styles.barOther : ''}`}
                style={{ '--size': top ? row.value / top : 0 }}
                tabIndex={0}
                role="img"
                aria-label={description}
              />
              <span className={styles.value} aria-hidden="true">
                {format(row.value)}
              </span>
              {/* Detalle al pasar el mouse o enfocar la barra (el valor también está escrito al lado). */}
              <span className={styles.tooltip} aria-hidden="true">
                <strong>{format(row.value)}</strong>
                <span>
                  {percentFormat.format(share)} del total · {row.label}
                </span>
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
