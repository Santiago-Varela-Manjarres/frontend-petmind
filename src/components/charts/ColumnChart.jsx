import styles from './ColumnChart.module.css'

const percentFormat = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 0 })

// Columnas verticales de una sola serie, en el orden recibido (por ejemplo, las etapas de una solicitud).
// Como es una sola serie no lleva leyenda: el título de la tarjeta dice qué se mide. Cada columna muestra su
// valor encima; al pasar el mouse o con el teclado se ve además el porcentaje del total.
// data: [{ label, value }] · format: cómo escribir el valor · label: nombre accesible del gráfico
export default function ColumnChart({ data, label, format = (value) => value }) {
  const total = data.reduce((sum, row) => sum + row.value, 0)
  const top = Math.max(0, ...data.map((row) => row.value))

  return (
    <ul className={styles.chart} aria-label={label}>
      {data.map((row) => {
        const share = total ? row.value / total : 0
        return (
          <li key={row.label} className={styles.column}>
            <span className={styles.plot}>
              <span className={styles.value} aria-hidden="true">
                {format(row.value)}
              </span>
              <span
                className={styles.bar}
                style={{ '--size': top ? row.value / top : 0 }}
                tabIndex={0}
                role="img"
                aria-label={`${row.label}: ${format(row.value)}, ${percentFormat.format(share)} del total`}
              />
              <span className={styles.tooltip} aria-hidden="true">
                <strong>{format(row.value)}</strong>
                <span>
                  {percentFormat.format(share)} del total · {row.label}
                </span>
              </span>
            </span>
            <span className={styles.label} aria-hidden="true">
              {row.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
