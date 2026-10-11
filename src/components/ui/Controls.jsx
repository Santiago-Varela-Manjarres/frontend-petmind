import { useId } from 'react'
import Icon from './Icon'
import styles from './Controls.module.css'

const normalize = (options) => options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option))

// Grupo de opciones excluyentes. variant "track": fondo gris con la opción activa en blanco (Propia/Arrendada/Familiar).
// variant "buttons": botones separados con borde (Sí / No / No sé).
export function SegmentedControl({ options, value, onChange, name, label, variant = 'track', size = 'md', fullWidth = true, disabled = false }) {
  const id = useId()
  const items = normalize(options)

  return (
    <div
      className={`${styles.segmented} ${styles[variant]} ${styles[`seg-${size}`]} ${fullWidth ? styles.full : ''}`}
      role="radiogroup"
      aria-label={label}
    >
      {items.map((option) => {
        const checked = value === option.value
        return (
          // String(): las opciones pueden ser true/false/null ("Sí / No / No sé"); React no acepta null
          // como value de un input ni como key. El valor real se sigue comparando y enviando sin convertir.
          <label key={String(option.value)} className={`${styles.segment} ${checked ? styles.segmentActive : ''} ${option.disabled || disabled ? styles.segmentDisabled : ''}`}>
            <input
              type="radio"
              className="sr-only"
              name={name ?? id}
              value={String(option.value)}
              checked={checked}
              disabled={option.disabled || disabled}
              onChange={() => onChange(option.value)}
            />
            {variant === 'buttons' && checked && <Icon name="check" className={styles.segmentCheck} strokeWidth={2.4} />}
            {option.dot && <span className={`${styles.dot} ${styles[`dot-${option.dot}`]}`} aria-hidden="true" />}
            {option.icon && <Icon name={option.icon} className={styles.segmentIcon} />}
            <span>{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}

// Interruptor (Apto con niños, notificaciones…).
export function Toggle({ checked, onChange, label, description, id }) {
  const autoId = useId()
  const toggleId = id ?? autoId

  return (
    <div className={styles.toggleRow}>
      {(label || description) && (
        <label htmlFor={toggleId} className={styles.toggleText}>
          {label && <span className={styles.toggleLabel}>{label}</span>}
          {description && <span className={styles.toggleDescription}>{description}</span>}
        </label>
      )}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ? undefined : 'Activar'}
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.knob} />
      </button>
    </div>
  )
}

// Chips de selección múltiple (o única con `single`). Las elegidas muestran un check.
export function ChipSelect({ options, values = [], onChange, single = false, label, showCheck = true, size = 'md' }) {
  const items = normalize(options)

  function toggle(value) {
    if (single) {
      onChange(values[0] === value ? [] : [value])
      return
    }
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }

  return (
    <div className={`chip-list ${styles.chips}`} role="group" aria-label={label}>
      {items.map((option) => {
        const active = values.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            className={`chip-option ${active ? 'active' : ''} ${size === 'sm' ? styles.chipSm : ''}`}
            aria-pressed={active}
            onClick={() => toggle(option.value)}
          >
            {showCheck && active && <Icon name="check" strokeWidth={2.4} />}
            {option.icon && !active && <Icon name={option.icon} />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// Contador − 1 + (¿Cuántas personas viven contigo?)
export function NumberStepper({ value, onChange, min = 0, max = 20, label }) {
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button type="button" className={styles.stepperButton} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Restar">
        <Icon name="minus" />
      </button>
      <output className={styles.stepperValue} aria-live="polite">
        {value}
      </output>
      <button type="button" className={styles.stepperButton} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Sumar">
        <Icon name="plus" />
      </button>
    </div>
  )
}

// Deslizador con burbuja del valor (¿Cuántas horas al día pasaría sola?)
export function RangeSlider({ value, onChange, min = 0, max = 100, step = 1, format = (v) => v, marks = [], label }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={styles.range}>
      <div className={styles.rangeBubbleTrack}>
        <span className={styles.rangeBubble} style={{ left: `${pct}%` }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        className={styles.rangeInput}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={format(value)}
        style={{ '--fill': `${pct}%` }}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {marks.length > 0 && (
        <div className={styles.rangeMarks} aria-hidden="true">
          {marks.map((mark) => (
            <span key={mark}>{mark}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// Rango doble (Edad: 6 meses – 5 años)
export function DualRange({ min, max, step = 1, value, onChange, labels = [], label }) {
  const [low, high] = value
  const lowPct = ((low - min) / (max - min)) * 100
  const highPct = ((high - min) / (max - min)) * 100

  return (
    <div className={styles.dual}>
      <div className={styles.dualTrack} style={{ '--low': `${lowPct}%`, '--high': `${highPct}%` }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          aria-label={`${label}: mínimo`}
          onChange={(event) => onChange([Math.min(Number(event.target.value), high - step), high])}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label={`${label}: máximo`}
          onChange={(event) => onChange([low, Math.max(Number(event.target.value), low + step)])}
        />
      </div>
      {labels.length > 0 && (
        <div className={styles.dualLabels} aria-hidden="true">
          {labels.map((text) => (
            <span key={text}>{text}</span>
          ))}
        </div>
      )}
    </div>
  )
}
