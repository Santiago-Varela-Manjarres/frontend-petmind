import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthTopBar from '../../components/layout/AuthTopBar'
import Icon from '../../components/ui/Icon'
import { IconBadge, PetScene } from '../../components/ui/Decor'
import { Field } from '../../components/forms/Field'
import { PasswordInput, PasswordStrength } from '../../components/forms/PasswordInput'
import { useAuth } from '../../context/AuthContext'
import { isValidPassword, PASSWORD_ERROR } from '../../utils/password'
import styles from './Acceso.module.css'

// 01 · Acceso / 08 · Recuperar contraseña — Crear nueva
export default function NuevaContrasena() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const newErrors = {}
    if (!isValidPassword(form.password)) newErrors.password = PASSWORD_ERROR
    if (!form.confirm) newErrors.confirm = 'Repite la contraseña.'
    else if (form.confirm !== form.password) newErrors.confirm = 'Las contraseñas no coinciden.'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    resetPassword(form.password)
    navigate('/recuperar/listo', { replace: true })
  }

  return (
    <>
      <title>Crea una nueva contraseña | PetMind</title>
      <AuthTopBar backTo="/login" backLabel="Volver a iniciar sesión" />

      <PetScene leftNote="Casi listo" rightNote="nueva clave, nuevo inicio">
        <form className={styles.cardContent} onSubmit={handleSubmit} noValidate>
          <IconBadge icon="shield-check" />
          <h1>Crea una nueva contraseña</h1>
          <p>Elige una contraseña que no hayas usado antes.</p>

          <div className={styles.cardForm}>
            <Field label="Nueva contraseña" htmlFor="new-password" error={errors.password}>
              <PasswordInput id="new-password" name="password" autoComplete="new-password" placeholder="Mínimo 8, una mayúscula y un símbolo" value={form.password} onChange={handleChange} invalid={Boolean(errors.password)} />
              <PasswordStrength value={form.password} showRules />
            </Field>
            <Field label="Confirmar contraseña" htmlFor="confirm-password" error={errors.confirm}>
              <PasswordInput id="confirm-password" name="confirm" autoComplete="new-password" placeholder="Repite la contraseña" value={form.confirm} onChange={handleChange} invalid={Boolean(errors.confirm)} />
            </Field>
            <button type="submit" className={`btn btn-primary btn-block ${styles.submit}`}>
              Guardar contraseña <Icon name="arrow-right" />
            </button>
          </div>
        </form>
      </PetScene>
    </>
  )
}
