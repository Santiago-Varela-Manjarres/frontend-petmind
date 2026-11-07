import { useState } from 'react'
import styles from './DonutChart.module.css'

const percentFormat = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 0 })

const SIZE = 208
const CENTER = SIZE / 2
const OUTER = 92
const INNER = 68
// La parte activa crece un poco hacia afuera (la marca "se levanta" al pasar el mouse).
const LIFT = 5

// Ángulo 0 arriba, en el sentido del reloj.
function point(radius, angle) {
  return [CENTER + radius * Math.sin(angle), CENTER - radius * Math.cos(angle)]
}

function ringSegment(start, end, outer, inner) {
  const large = end - start > Math.PI ? 1 : 0
  const [x0, y0] = point(outer, start)
  const [x1, y1] = point(outer, end)
  const [x2, y2] = point(inner, end)
  const [x3, y3] = point(inner, start)
  return `M${x0} ${y0} A${outer} ${outer} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${inner} ${inner} 0 ${large} 0 ${x3} ${y3} Z`
}

// Dona (torta) de partes de un todo, con hasta 4 partes. Cada fila trae `slot` (1 a 4): el color sigue a la
// categoría, no a su tamaño. La leyenda nombra cada parte con su cantidad y porcentaje (la identidad nunca
// depende solo del color) y es la que recibe el foco del teclado; el centro muestra el total o la parte activa.
// data: [{ label, value, slot }] · unit: ['mascota', 'mascotas'] · format: cómo escribir el valor
export default function DonutChart({ data, label, unit = ['', ''], format = (value) => value }) {
  const [active, setActive] = useState(null)
  const rows = data.filter((row) => row.value > 0)
  const total = rows.reduce((sum, row) => sum + row.value, 0)

  const segments = rows.reduce((list, row) => {
    const previous = list[list.length - 1]
    const start = previous ? previous.start + previous.sweep : 0
    const sweep = total ? (row.value / total) * Math.PI * 2 : 0
    // Una sola parte es el anillo completo: se cierra casi del todo para que el arco no se anule.
    const end = rows.length === 1 ? start + Math.PI * 2 - 0.0001 : start + sweep
    return [...list, { ...row, start, sweep, end, share: total ? row.value / total : 0 }]
  }, [])
  const current = segments.find((segment) => segment.label === active)
  const unitFor = (value) => (value === 1 ? unit[0] : unit[1])

  return (
    <div className={styles.chart} role="group" aria-label={label}>
      <div className={styles.ring}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" onPointerLeave={() => setActive(null)}>
          {segments.map((segment) => (
            <path
              key={segment.label}
              className={`${styles.segment} ${segment.slot ? styles[`slot${segment.slot}`] : styles.slotOther} ${segment === current ? styles.lifted : ''}`}
              d={ringSegment(segment.start, segment.end, segment === current ? OUTER + LIFT : OUTER, INNER)}
              onPointerEnter={() => setActive(segment.label)}
            />
          ))}
          {/* Separación de 2 px en el color de la superficie entre partes vecinas (no un borde alrededor). */}
          {segments.length > 1 &&
            segments.map((segment) => {
              const [x1, y1] = point(INNER - 1, segment.start)
              const [x2, y2] = point(OUTER + LIFT + 1, segment.start)
              return <line key={`gap-${segment.label}`} className={styles.gap} x1={x1} y1={y1} x2={x2} y2={y2} />
            })}
        </svg>
        {/* Lectura del centro: el valor manda y la etiqueta lo acompaña. */}
        <div className={styles.center} aria-hidden="true">
          <strong>{format(current ? current.value : total)}</strong>
          <span>{current ? current.label : unitFor(total)}</span>
          {current && <small>{percentFormat.format(current.share)} del total</small>}
        </div>
      </div>

      <ul className={styles.legend}>
        {segments.map((segment) => (
          <li key={segment.label}>
            <span
              className={`${styles.legendRow} ${segment === current ? styles.legendActive : ''}`}
              role="img"
              tabIndex={0}
              aria-label={`${segment.label}: ${format(segment.value)} ${unitFor(segment.value)}, ${percentFormat.format(segment.share)} del total`}
              onPointerEnter={() => setActive(segment.label)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(segment.label)}
              onBlur={() => setActive(null)}
            >
              <span className={`${styles.swatch} ${segment.slot ? styles[`slot${segment.slot}`] : styles.slotOther}`} />
              <span className={styles.name}>{segment.label}</span>
              <span className={styles.amount}>{format(segment.value)}</span>
              <span className={styles.share}>{percentFormat.format(segment.share)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
