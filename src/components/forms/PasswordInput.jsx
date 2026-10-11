import { useState } from 'react'
import Icon from '../ui/Icon'
import { passwordRules, passwordScore } from '../../utils/password'
import styles from './PasswordInput.module.css'

// Campo de contraseña con candado y botón para mostrar / ocultar.
export function PasswordInput({ invalid, className = '', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="input-group">
      <Icon name="lock" className="input-icon" />
      <input
        className={`input ${styles.input} ${className}`}
        type={visible ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <button
        type="button"
        className={`input-action ${styles.toggle}`}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} />
      </button>
    </div>
  )
}

// Un nivel por cada regla cumplida (ver utils/password.js).
const levels = [
  { label: '', tone: '' },
  { label: 'Débil', tone: 'weak' },
  { label: 'Media', tone: 'medium' },
  { label: 'Contraseña segura', tone: 'strong' },
]

// Una barra por regla + etiqueta, y opcionalmente la lista de requisitos.
export function PasswordStrength({ value, showRules = false }) {
  const score = passwordScore(value)
  const level = levels[score]
  const shownLabel = level.label

  return (
    <div className={styles.strength}>
      <div className={styles.meter}>
        <div className={styles.bars} aria-hidden="true">
          {passwordRules.map((rule, index) => (
            <span key={rule.id} className={`${styles.bar} ${index < score ? styles[level.tone] : ''}`} />
          ))}
        </div>
        <span className={`${styles.label} ${styles[`label-${level.tone}`] ?? ''}`} aria-live="polite">
          {value ? shownLabel : ''}
        </span>
      </div>

      {showRules && (
        <ul className={styles.rules}>
          {passwordRules.map((rule) => {
            const ok = rule.test(value)
            return (
              <li key={rule.id} className={ok ? styles.ruleOk : ''}>
                <span className={styles.ruleIcon}>{ok && <Icon name="check" strokeWidth={3} />}</span>
                {rule.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
