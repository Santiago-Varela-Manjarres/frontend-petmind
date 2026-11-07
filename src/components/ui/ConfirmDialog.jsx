import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'
import styles from './ConfirmDialog.module.css'

const MIN_REASON = 10

// Ventana de confirmación con <dialog> nativo: atrapa el foco, se cierra con Esc y oscurece el fondo.
// Se usa en el panel de administración para las decisiones que se explican a la fundación o a la persona.
//   reasonLabel → pide un motivo (mínimo 10 caracteres) que llega a onConfirm({ reason })
//   option      → casilla adicional { label, hint, defaultChecked } que llega como onConfirm({ option })
//   tone        → 'danger' pinta el botón de confirmar en rojo
export default function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = 'Confirmar',
  tone = 'primary',
  icon,
  reasonLabel,
  reasonPlaceholder = '',
  option,
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const reasonId = useId()
  const [reason, setReason] = useState('')
  const [checked, setChecked] = useState(true)
  const [error, setError] = useState('')

  // Cada vez que se abre empieza limpio (el mismo diálogo sirve para varias acciones).
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== Boolean(open)) {
    setWasOpen(Boolean(open))
    if (open) {
      setReason('')
      setError('')
      setChecked(option?.defaultChecked ?? true)
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleSubmit(event) {
    event.preventDefault()
    if (reasonLabel && reason.trim().length < MIN_REASON) {
      setError(`Escribe un motivo de al menos ${MIN_REASON} caracteres: se lo mostraremos a quien recibe la decisión.`)
      return
    }
    onConfirm?.({ reason: reason.trim(), option: Boolean(option) && checked })
    onClose()
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onClose={onClose}>
      {open && (
        <form className={styles.body} onSubmit={handleSubmit} noValidate>
          <header className={styles.header}>
            {icon && (
              <span className={`${styles.icon} ${tone === 'danger' ? styles.iconDanger : ''}`}>
                <Icon name={icon} />
              </span>
            )}
            <h2 id={titleId}>{title}</h2>
            <button type="button" className={`icon-btn icon-btn-plain ${styles.close}`} onClick={onClose} aria-label="Cerrar">
              <Icon name="x" />
            </button>
          </header>

          {text && <p className={styles.text}>{text}</p>}

          {reasonLabel && (
            <div className="field">
              <label className="field-label" htmlFor={reasonId}>
                {reasonLabel}
              </label>
              <textarea
                id={reasonId}
                className="textarea"
                rows={4}
                value={reason}
                placeholder={reasonPlaceholder}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? `${reasonId}-error` : undefined}
                onChange={(event) => {
                  setReason(event.target.value)
                  setError('')
                }}
                autoFocus
              />
              {error && (
                <span className="field-error" id={`${reasonId}-error`} role="alert">
                  {error}
                </span>
              )}
            </div>
          )}

          {option && (
            <label className={`checkbox ${styles.option}`}>
              <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
              <span>
                {option.label}
                {option.hint && <small>{option.hint}</small>}
              </span>
            </label>
          )}

          <footer className={styles.actions}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={`btn ${tone === 'danger' ? styles.dangerButton : 'btn-primary'}`}>
              {confirmLabel}
            </button>
          </footer>
        </form>
      )}
    </dialog>
  )
}
