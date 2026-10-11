import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../../components/ui/Logo'
import Icon from '../../components/ui/Icon'
import { ChipSelect } from '../../components/ui/Controls'
import { Stepper } from '../../components/forms/Steppers'
import { Field, IconInput, SelectInput } from '../../components/forms/Field'
import { PasswordInput, PasswordStrength } from '../../components/forms/PasswordInput'
import { useAuth } from '../../context/AuthContext'
import { cityNames } from '../../data/cities'
import { interestOptions } from '../../data/users'
import { isValidEmail, onlyDigits } from '../../utils/format'
import styles from './Acceso.module.css'
import { isValidPassword, PASSWORD_ERROR } from '../../utils/password'

const initialForm = {
  name: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  password: '',
  interests: ['Adoptar', 'Donar'],
  terms: false,
}

function validate(form, users) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Escribe tu nombre.'
  if (!form.lastName.trim()) errors.lastName = 'Escribe tu apellido.'
  if (!form.email.trim()) errors.email = 'Escribe tu correo.'
  else if (!isValidEmail(form.email)) errors.email = 'Revisa el formato del correo.'
  else if (users.some((user) => user.email.toLowerCase() === form.email.trim().toLowerCase())) errors.email = 'Ya existe una cuenta con este correo.'
  const phone = onlyDigits(form.phone)
  if (!phone) errors.phone = 'Escribe tu celular.'
  else if (phone.length !== 10 || !phone.startsWith('3')) errors.phone = 'Debe tener 10 dígitos y empezar por 3.'
  if (!form.city) errors.city = 'Elige tu ciudad.'
  if (!isValidPassword(form.password)) errors.password = PASSWORD_ERROR
  if (!form.terms) errors.terms = 'Debes aceptar los términos para crear tu cuenta.'
  return errors
}

// 01 · Acceso / 03 · Registro paso 2 — Datos de persona
export default function RegistroPersona() {
  const { register, users } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const newErrors = validate(form, users)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const result = register({
      accountType: 'persona',
      name: form.name.trim(),
      lastName: form.lastName.trim(),
      email: form.email,
      phone: onlyDigits(form.phone),
      city: form.city,
      password: form.password,
      interests: form.interests,
      housing: '',
    })
    if (!result.ok) {
      setErrors({ email: result.error })
      return
    }
    navigate('/registro/verificar')
  }

  return (
    <div className={styles.split}>
      <title>Crea tu cuenta | PetMind</title>

      <div className={styles.splitForm}>
        <header className={styles.splitHeader}>
          <Logo />
          <Link className={styles.backLink} to="/registro">
            <Icon name="arrow-left" /> Cambiar tipo de cuenta
          </Link>
        </header>

        <div className={styles.splitBody}>
          <Stepper steps={['Tipo de cuenta', 'Tus datos', 'Verificación']} current={2} />
          <h1 className={styles.registerTitle}>
            Crea tu cuenta <span>personal</span>
          </h1>
          <p className={styles.lead}>Solo te tomará un minuto. Tus datos están protegidos.</p>

          <form className={styles.registerForm} onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <Field label="Nombre" htmlFor="reg-name" error={errors.name}>
                <input id="reg-name" className="input" name="name" autoComplete="given-name" placeholder="Tu nombre" value={form.name} onChange={handleChange} aria-invalid={Boolean(errors.name) || undefined} />
              </Field>
              <Field label="Apellido" htmlFor="reg-lastname" error={errors.lastName}>
                <input id="reg-lastname" className="input" name="lastName" autoComplete="family-name" placeholder="Tu apellido" value={form.lastName} onChange={handleChange} aria-invalid={Boolean(errors.lastName) || undefined} />
              </Field>
            </div>

            <Field label="Correo electrónico" htmlFor="reg-email" error={errors.email}>
              <IconInput id="reg-email" icon="mail" name="email" type="email" autoComplete="email" placeholder="tu.correo@correo.com" value={form.email} onChange={handleChange} invalid={Boolean(errors.email)} />
            </Field>

            <div className="form-row">
              <Field label="Celular" htmlFor="reg-phone" error={errors.phone}>
                <div className="input-group">
                  <span className={styles.phonePrefix} aria-hidden="true">
                    <span className={styles.flag} /> +57
                  </span>
                  <input
                    id="reg-phone"
                    className={`input ${styles.phoneInput}`}
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="300 123 4567"
                    value={form.phone}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.phone) || undefined}
                  />
                </div>
              </Field>
              <Field label="Ciudad" htmlFor="reg-city" error={errors.city}>
                <SelectInput id="reg-city" icon="map-pin" name="city" value={form.city} onChange={handleChange} invalid={Boolean(errors.city)}>
                  <option value="">Elige tu ciudad</option>
                  {cityNames.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </SelectInput>
              </Field>
            </div>

            <Field label="Contraseña" htmlFor="reg-password" error={errors.password}>
              <PasswordInput id="reg-password" name="password" autoComplete="new-password" placeholder="Mínimo 8, una mayúscula y un símbolo" value={form.password} onChange={handleChange} invalid={Boolean(errors.password)} />
              <PasswordStrength value={form.password} showRules />
            </Field>

            <Field label="¿Qué te gustaría hacer en PetMind?" optional>
              <ChipSelect options={interestOptions} values={form.interests} onChange={(interests) => setForm((prev) => ({ ...prev, interests }))} label="Intereses" />
            </Field>

            <div className="field">
              <label className="checkbox">
                <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} aria-invalid={Boolean(errors.terms) || undefined} />
                <span>
                  Acepto los <Link to="/legal#terminos">Términos y condiciones</Link> y la <Link to="/legal#datos">Política de tratamiento de datos</Link>
                </span>
              </label>
              {errors.terms && <span className="field-error">{errors.terms}</span>}
            </div>

            <button type="submit" className={`btn btn-primary btn-block ${styles.submit}`}>
              Crear mi cuenta <Icon name="arrow-right" />
            </button>
          </form>
        </div>
      </div>

      <aside className={styles.sidePanel} aria-hidden="true">
        <div className={styles.polaroids}>
          <figure className={`${styles.polaroid} ${styles.polaroidA}`}>
            <img src="/img/fotos/mascota-simon-gato.jpg" alt="" />
            <strong>Simón</strong>
            <small>1 año · Bogotá</small>
            <span className={styles.polaroidHeart}>
              <Icon name="heart-filled" />
            </span>
          </figure>
          <figure className={`${styles.polaroid} ${styles.polaroidB}`}>
            <img src="/img/fotos/mascota-rocky-perro.jpg" alt="" />
            <strong>Rocky</strong>
            <small>3 años · Cali</small>
            <span className={styles.polaroidHeart}>
              <Icon name="heart-filled" />
            </span>
          </figure>
          <figure className={`${styles.polaroid} ${styles.polaroidC}`}>
            <img src="/img/fotos/mascota-nala-gata.jpg" alt="" />
            <strong>Nala</strong>
            <small>1 año · Medellín</small>
            <span className={styles.polaroidHeart}>
              <Icon name="heart-filled" />
            </span>
          </figure>
        </div>
        <p className={styles.sideScript}>Alguien te está esperando...</p>
        <h2>Más de 300 peludos buscan una familia como la tuya.</h2>
        <p>Crea tu cuenta, guarda tus favoritos y recibe avisos cuando llegue una mascota compatible contigo.</p>
        <div className={styles.community}>
          <span className={styles.communityAvatars}>
            <img src="/img/fotos/mascota-luna-perra.jpg" alt="" />
            <img src="/img/fotos/miniatura-video-historias-que-inspiran.jpg" alt="" />
            <img src="/img/fotos/mascota-simon-gato.jpg" alt="" />
            <img src="/img/fotos/mascota-canela-perra.jpg" alt="" />
          </span>
          +2.800 personas ya se unieron
        </div>
      </aside>
    </div>
  )
}
