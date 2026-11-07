import { useEffect, useId, useRef, useState } from 'react'
import styles from './AreaChart.module.css'

const HEIGHT = 240
const PAD = { top: 30, right: 18, bottom: 34, left: 38 }

// Paso "redondo" para el eje Y (1, 2, 5, 10, 20…).
function niceStep(raw) {
  const power = 10 ** Math.floor(Math.log10(raw))
  const unit = raw / power
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power
}

function yTicks(max) {
  if (max <= 0) return [0, 1]
  const step = Math.max(1, niceStep(max / 4))
  const top = Math.ceil(max / step) * step
  const ticks = []
  for (let value = 0; value <= top; value += step) ticks.push(value)
  return ticks
}

// Curva suave que no inventa picos ni baja de cero entre dos puntos (interpolación monótona de Fritsch-Carlson).
function monotonePath(points) {
  const n = points.length
  if (!n) return ''
  if (n < 3) return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  const slopes = []
  for (let i = 0; i < n - 1; i += 1) slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]))
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0]
    if (i === n - 1) return slopes[n - 2]
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2
  })
  for (let i = 0; i < n - 1; i += 1) {
    if (slopes[i] === 0) {
      tangents[i] = 0
      tangents[i + 1] = 0
      continue
    }
    const a = tangents[i] / slopes[i]
    const b = tangents[i + 1] / slopes[i]
    const length = a * a + b * b
    if (length > 9) {
      const k = 3 / Math.sqrt(length)
      tangents[i] = k * a * slopes[i]
      tangents[i + 1] = k * b * slopes[i]
    }
  }
  let path = `M${points[0][0]} ${points[0][1]}`
  for (let i = 0; i < n - 1; i += 1) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const third = (x1 - x0) / 3
    path += ` C${x0 + third} ${y0 + third * tangents[i]} ${x1 - third} ${y1 - third * tangents[i + 1]} ${x1} ${y1}`
  }
  return path
}

// Área ("montaña") de una sola serie en el tiempo: línea de 2 px y relleno suave. La línea vertical sigue al
// mouse y se ajusta al punto más cercano; con el teclado se recorre con las flechas. Se rotula solo el pico.
// data: [{ label, short, value }] en orden de tiempo · unit: ['mascota', 'mascotas']
export default function AreaChart({ data, label, unit = ['', ''], format = (value) => value }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState(null)
  const gradientId = `area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  useEffect(() => {
    const element = wrapRef.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const n = data.length
  const plotWidth = width - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const baseline = PAD.top + plotHeight
  const ticks = yTicks(Math.max(0, ...data.map((row) => row.value)))
  const yMax = ticks[ticks.length - 1]
  const x = (index) => PAD.left + (n === 1 ? plotWidth / 2 : (index * plotWidth) / (n - 1))
  const y = (value) => PAD.top + plotHeight * (1 - value / yMax)
  const points = data.map((row, index) => [x(index), y(row.value)])
  const line = monotonePath(points)
  const area = n ? `${line} L${points[n - 1][0]} ${baseline} L${points[0][0]} ${baseline} Z` : ''
  const peak = data.reduce((best, row, index) => (row.value > data[best].value ? index : best), 0)
  // Etiquetas del eje X: tantas como quepan sin chocar (unos 64 px cada una).
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotWidth / 64))))
  const unitFor = (value) => (value === 1 ? unit[0] : unit[1])
  const current = active === null ? null : data[active]

  function indexAt(clientX) {
    const rect = wrapRef.current.getBoundingClientRect()
    if (n === 1) return 0
    const index = Math.round(((clientX - rect.left - PAD.left) / plotWidth) * (n - 1))
    return Math.min(n - 1, Math.max(0, index))
  }

  function handleKey(event) {
    if (!n) return
    const from = active ?? n - 1
    const moves = { ArrowRight: from + 1, ArrowLeft: from - 1, Home: 0, End: n - 1 }
    if (!(event.key in moves)) return
    event.preventDefault()
    setActive(Math.min(n - 1, Math.max(0, moves[event.key])))
  }

  const summary = n
    ? `De ${data[0].short} a ${data[n - 1].short}. Máximo: ${format(data[peak].value)} ${unitFor(data[peak].value)}, ${data[peak].label.toLowerCase()}.`
    : ''
  // La lectura va al lado de la línea vertical, hacia donde haya más espacio, dentro del área de la gráfica.
  const tooltipOnRight = current ? x(active) < width / 2 : true
  const tooltipLeft = current ? x(active) + (tooltipOnRight ? 12 : -12) : 0

  return (
    <div
      ref={wrapRef}
      className={styles.chart}
      role="group"
      tabIndex={0}
      aria-label={`${label}. ${summary} Usa las flechas para recorrer las semanas.`}
      onKeyDown={handleKey}
      onFocus={() => setActive((value) => value ?? n - 1)}
      onBlur={() => setActive(null)}
      onPointerMove={(event) => setActive(indexAt(event.clientX))}
      onPointerLeave={() => setActive(null)}
    >
      <svg width={width} height={HEIGHT} aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className={styles.fillTop} />
            <stop offset="100%" className={styles.fillBottom} />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line className={tick === 0 ? styles.baseline : styles.grid} x1={PAD.left} x2={width - PAD.right} y1={Math.round(y(tick)) + 0.5} y2={Math.round(y(tick)) + 0.5} />
            <text className={styles.tick} x={PAD.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
              {format(tick)}
            </text>
          </g>
        ))}

        {data.map((row, index) =>
          index % every === 0 ? (
            <text key={row.label} className={styles.tick} x={x(index)} y={baseline + 20} textAnchor="middle">
              {row.short}
            </text>
          ) : null,
        )}

        <path className={styles.area} d={area} fill={`url(#${gradientId})`} />
        <path className={styles.line} d={line} />

        {/* Rótulo directo solo en el pico (si la lectura ya está sobre el pico, sobra). */}
        {n > 0 && active !== peak && (
          <g>
            <circle className={styles.marker} cx={points[peak][0]} cy={points[peak][1]} r="4" />
            <text className={styles.peakLabel} x={points[peak][0]} y={points[peak][1] - 12} textAnchor="middle">
              {format(data[peak].value)}
            </text>
          </g>
        )}

        {current && (
          <g>
            <line className={styles.crosshair} x1={Math.round(x(active)) + 0.5} x2={Math.round(x(active)) + 0.5} y1={PAD.top - 6} y2={baseline} />
            <circle className={styles.marker} cx={points[active][0]} cy={points[active][1]} r="5" />
          </g>
        )}
      </svg>

      {current && (
        <div
          className={`${styles.tooltip} ${tooltipOnRight ? '' : styles.tooltipLeft}`}
          style={{ left: tooltipLeft, top: PAD.top }}
          aria-hidden="true"
        >
          <strong>
            {format(current.value)} {unitFor(current.value)}
          </strong>
          <span>{current.label}</span>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {current ? `${current.label}: ${format(current.value)} ${unitFor(current.value)}` : ''}
      </p>
    </div>
  )
}
