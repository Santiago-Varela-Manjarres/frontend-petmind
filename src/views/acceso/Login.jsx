import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../../components/ui/Logo'
import Icon from '../../components/ui/Icon'
import { Field, IconInput } from '../../components/forms/Field'
import { PasswordInput } from '../../components/forms/PasswordInput'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { DEMO_PASSWORD } from '../../data/users'
import { homeFor, isOtherAccountArea } from '../../routes/areas'
import { isValidEmail } from '../../utils/format'
import styles from './Acceso.module.css'

const initialForm = { email: '', password: '', remember: true }

const demoAccounts = [
  { email: 'brayan.ciro@correo.com', label: 'Persona · Brayan' },
  { email: 'huellitas@correo.com', label: 'Fundación · Huellitas de Amor' },
  { email: 'huellasdelcaribe@correo.com', label: 'Fundación en revisión · Huellas del Caribe' },
  { email: 'admin@petmind.co', label: 'Administración · Equipo PetMind' },
]

// "¡Hola de nuevo, …!" según el tipo de cuenta.
function greetingName(user) {
  if (user.accountType === 'fundacion') return `equipo de ${user.name}`
  if (user.accountType === 'admin') return 'equipo PetMind'
  return user.name
}

function validate(form) {
  const errors = {}
  if (!form.email.trim()) errors.email = 'Escribe tu correo electrónico.'
  else if (!isValidEmail(form.email)) errors.email = 'Revisa el formato del correo.'
  if (!form.password) errors.password = 'Escribe tu contraseña.'
  return errors
}

// 01 · Acceso / 01 · Iniciar sesión
const Login = () => {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [foundationMode, setFoundationMode] = useState(false)

  const from = location.state?.from
  const reason = location.state?.reason

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const newErrors = validate(form)
    setErrors(newErrors)
    setAuthError('')
    if (Object.keys(newErrors).length > 0) return

    const result = login(form.email, form.password, form.remember)
    if (!result.ok) {
      setAuthError(result.error)
      return
    }

    const { user } = result
    showToast(`¡Hola de nuevo, ${greetingName(user)}!`)
    const canReturn = from && !isOtherAccountArea(from, user.accountType)
    navigate(canReturn ? from : homeFor(user.accountType), { replace: true })
  }

  function fillDemo(email) {
    setForm({ email, password: DEMO_PASSWORD, remember: true })
    setErrors({})
    setAuthError('')
  }

  return (
    <div className={styles.login}>
      <title>Iniciar sesión | PetMind</title>

      <aside className={styles.photoPanel} aria-hidden="true">
        <img src="/img/fotos/portada-mujer-abrazando-perro.jpg" alt="" />
        <Logo light to={null} />
        <div className={styles.floatingCard}>
          <img src="/img/fotos/mascota-luna-perra.jpg" alt="" />
          <div>
            <strong>Luna encontró hogar</strong>
            <small>Medellín · hace 2 días</small>
            <span className={styles.adoptedTag}>
              <Icon name="heart-filled" /> Adoptada
            </span>
          </div>
        </div>
        <p className={styles.photoQuote}>
          Más que mascotas,
          <br />
          son <em>historias</em> que importan <Icon name="heart" />
        </p>
        <div className={styles.stats}>
          <div>
            <strong>1.240</strong>
            <span>adopciones logradas</span>
          </div>
          <div>
            <strong>86</strong>
            <span>fundaciones aliadas</span>
          </div>
          <div>
            <strong>$320M</strong>
            <span>donados a tratamientos</span>
          </div>
        </div>
      </aside>

      <div className={styles.formColumn}>
        <div className={styles.formTop}>
          <span>¿Aún no tienes cuenta?</span>
          <Link className="btn btn-secondary" to="/registro">
            Crear cuenta
          </Link>
        </div>

        <div className={styles.formBody}>
          <span className={styles.welcome}>
            <Icon name="heart-filled" />
            {foundationMode ? 'Panel de fundaciones' : 'Qué bueno verte de nuevo'}
          </span>
          <h1 className={styles.loginTitle}>
            Inicia sesión y sigue <span>cambiando vidas.</span>
          </h1>
          <p className={styles.lead}>
            {foundationMode
              ? 'Gestiona tus mascotas, las solicitudes de adopción y tus campañas.'
              : 'Revisa tus solicitudes de adopción, tus donaciones y las historias que sigues.'}
          </p>

          {reason === 'favoritos' && (
            <div className={`alert alert-info ${styles.notice}`}>
              <Icon name="heart" /> Inicia sesión para guardar tus mascotas favoritas.
            </div>
          )}
          {from && reason !== 'favoritos' && (
            <div className={`alert alert-info ${styles.notice}`}>
              <Icon name="lock" /> Inicia sesión para continuar.
            </div>
          )}

          <form className="form" onSubmit={handleSubmit} noValidate>
            <Field label="Correo electrónico" htmlFor="login-email" error={errors.email}>
              <IconInput
                id="login-email"
                icon="mail"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tu.correo@correo.com"
                value={form.email}
                onChange={handleChange}
                invalid={Boolean(errors.email)}
              />
            </Field>

            <Field label="Contraseña" htmlFor="login-password" error={errors.password}>
              <PasswordInput
                id="login-password"
                name="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={form.password}
                onChange={handleChange}
                invalid={Boolean(errors.password)}
              />
            </Field>

            <div className={styles.formRow}>
              <label className="checkbox">
                <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} />
                Recordarme
              </label>
              <Link className="link" to="/recuperar">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {authError && (
              <div className="alert alert-error" role="alert">
                <Icon name="alert-circle" /> {authError}
              </div>
            )}

            <button type="submit" className={`btn btn-primary btn-block ${styles.submit}`}>
              Iniciar sesión <Icon name="arrow-right" />
            </button>

            <p className={styles.altLink}>
              {foundationMode ? '¿Eres una persona? ' : '¿Eres una fundación? '}
              <button type="button" className="link-button" onClick={() => setFoundationMode((prev) => !prev)}>
                {foundationMode ? 'Ingresa a tu cuenta personal' : 'Ingresa al panel de fundaciones'}
              </button>
            </p>

            <details className={styles.demo}>
              <summary>¿Probando la demo? Usa una cuenta de prueba</summary>
              <div className={styles.demoAccounts}>
                {demoAccounts.map((account) => (
                  <button key={account.email} type="button" onClick={() => fillDemo(account.email)}>
                    {account.label}
                    <span>{account.email}</span>
                  </button>
                ))}
              </div>
            </details>
          </form>
        </div>

        <nav className={styles.legalLinks} aria-label="Información legal">
          <Link to="/legal#terminos">Términos y condiciones</Link>
          <Link to="/legal#privacidad">Política de privacidad</Link>
          <Link to="/contacto">Ayuda</Link>
        </nav>
      </div>
    </div>
  )
}

export default Login
