import { startTransition, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { SexBadge, VerifiedBadge } from '../../components/ui/Badges'
import { Breadcrumbs } from '../../components/ui/Navigation'
import { NumberStepper, SegmentedControl } from '../../components/ui/Controls'
import { Field } from '../../components/forms/Field'
import { OptionCard } from '../../components/forms/OptionCard'
import NoEncontrada from '../NoEncontrada'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useMascotasPublicas } from '../../hooks/useMascotasPublicas'
import { useDatosMascotaPublica } from '../../hooks/useDatosMascotaPublica'
import { crearSolicitud, listarSolicitudesDeUsuario } from '../../services/solicitudesService'
import { closedStatuses, housingTypes } from '../../services/solicitudMapper'
import { sizeLabel } from '../../data/pets'
import { fullName } from '../../data/users'
import { formatAge } from '../../utils/dates'
import { formatPhone } from '../../utils/format'
import styles from './SolicitudAdopcion.module.css'

const yesNo = ['Sí', 'No']

const emptyAnswers = {
  tipoVivienda: '',
  tenencia: '',
  tienePatio: '',
  numeroConvivientes: 1,
  tieneOtraMascota: '',
  descripcionOtrasMascotas: '',
  experienciaPrevia: '',
  horasDisponiblesDia: 4,
  motivoAdopcion: '',
  aceptaCompromisos: false,
  autorizaDatos: false,
}

function validate(answers) {
  const errors = {}
  if (!answers.tipoVivienda) errors.tipoVivienda = 'Elige el tipo de vivienda.'
  if (!answers.tenencia) errors.tenencia = 'Cuéntanos si la vivienda es propia o arrendada.'
  if (!answers.tienePatio) errors.tienePatio = 'Responde si tienes patio o zona verde.'
  if (!answers.tieneOtraMascota) errors.tieneOtraMascota = 'Responde si tienes otras mascotas.'
  if (answers.tieneOtraMascota === 'Sí' && answers.descripcionOtrasMascotas.trim().length < 3) {
    errors.descripcionOtrasMascotas = 'Cuéntanos qué mascotas tienes.'
  }
  if (answers.experienciaPrevia.trim().length < 10) errors.experienciaPrevia = 'Escribe al menos 10 caracteres.'
  if (answers.motivoAdopcion.trim().length < 30) errors.motivoAdopcion = 'Escribe al menos 30 caracteres.'
  if (!answers.aceptaCompromisos) errors.aceptaCompromisos = 'Debes aceptar los compromisos de adopción.'
  if (!answers.autorizaDatos) errors.autorizaDatos = 'Debes autorizar el uso de tus datos para este proceso.'
  return errors
}

// DatosHogar del backend (embebido en SolicitudAdopcion).
function toDatosHogar(answers) {
  return {
    tipoVivienda: answers.tipoVivienda,
    esPropietario: answers.tenencia === 'Propia',
    tienePatio: answers.tienePatio === 'Sí',
    numeroConvivientes: answers.numeroConvivientes,
    tieneOtraMascota: answers.tieneOtraMascota === 'Sí',
    descripcionOtrasMascotas: answers.tieneOtraMascota === 'Sí' ? answers.descripcionOtrasMascotas.trim() : null,
    experienciaPrevia: answers.experienciaPrevia.trim(),
    horasDisponiblesDia: answers.horasDisponiblesDia,
    motivoAdopcion: answers.motivoAdopcion.trim(),
    aceptaCompromisos: answers.aceptaCompromisos,
    autorizaDatos: answers.autorizaDatos,
  }
}

// 02 · Adopción · Solicitud para una mascota publicada en el backend. Se guarda con POST /solicitudes-adopcion
// y le llega a la fundación en su panel.
export default function SolicitudAdopcionApi() {
  const { id } = useParams()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { pets, status, retry } = useMascotasPublicas()
  const pet = pets.find((item) => item.id === id)
  const { fundacion } = useDatosMascotaPublica(pet?.foundationId)
  const [answers, setAnswers] = useState(emptyAnswers)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [serverError, setServerError] = useState('')
  // Solicitud abierta que la persona ya tenga para esta mascota (una por mascota).
  const [existing, setExisting] = useState({ userId: null, request: null })

  const backendId = user?.backendId
  useEffect(() => {
    if (!backendId) return undefined
    let active = true
    listarSolicitudesDeUsuario(backendId)
      .then((list) => {
        const open = (Array.isArray(list) ? list : []).find(
          (item) => String(item.mascotaId) === id && !closedStatuses.includes(item.estado),
        )
        if (active) setExisting({ userId: backendId, request: open ?? null })
      })
      .catch(() => {
        if (active) setExisting({ userId: backendId, request: null })
      })
    return () => {
      active = false
    }
  }, [backendId, id])

  function set(name, value) {
    setAnswers((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    set(name, type === 'checkbox' ? checked : value)
  }

  function switchAccount() {
    startTransition(() => {
      logout()
      navigate('/registro/persona')
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (sending) return
    const found = validate(answers)
    setErrors(found)
    setServerError('')
    if (Object.keys(found).length) {
      showToast('Revisa los campos marcados.', { tone: 'error' })
      return
    }
    setSending(true)
    try {
      const created = await crearSolicitud({ usuarioId: backendId, mascotaId: Number(pet.id), datosHogar: toDatosHogar(answers) })
      showToast(`¡Solicitud enviada! ${fundacion?.nombre ?? 'La fundación'} la revisará pronto.`, { tone: 'success' })
      navigate(`/cuenta/solicitudes/backend/${created.id}`, { replace: true })
    } catch (error) {
      setServerError(error.message)
      setSending(false)
    }
  }

  if (status === 'loading') return <div className="page container" role="status">Cargando mascota…</div>
  if (status === 'error') {
    return (
      <div className="page container" role="alert">
        <p>No fue posible cargar la mascota.</p>
        <button type="button" className="btn btn-outline" onClick={retry}>Reintentar</button>
      </div>
    )
  }
  if (!pet) {
    return <NoEncontrada title="Esta mascota ya no recibe solicitudes" text="Puede que ya haya encontrado hogar. Mira otros peludos que te esperan." backTo="/adoptar" backLabel="Ver mascotas" />
  }

  const profileUrl = `/adoptar/backend/${encodeURIComponent(pet.id)}`
  const verified = fundacion?.estadoVerificacion === 'VERIFICADA'
  const checkingExisting = backendId && existing.userId !== backendId

  let content
  if (!backendId) {
    content = (
      <section className={`panel ${styles.formCard}`}>
        <h2 className={styles.stepTitle}>Necesitas una cuenta de PetMind</h2>
        <p className={styles.stepLead}>
          {pet.name} fue publicad{pet.sex === 'Hembra' ? 'a' : 'o'} por una fundación conectada a PetMind. La solicitud se envía a
          la fundación desde tu cuenta, y la cuenta con la que entraste es solo de demostración.
        </p>
        <div className="form-actions">
          <Link className="btn btn-secondary btn-lg" to={profileUrl}>
            <Icon name="chevron-left" /> Volver
          </Link>
          <button type="button" className="btn btn-primary btn-lg" onClick={switchAccount}>
            Crear mi cuenta <Icon name="arrow-right" />
          </button>
        </div>
      </section>
    )
  } else if (checkingExisting) {
    content = (
      <section className={`panel ${styles.formCard}`} role="status">
        Revisando tus solicitudes…
      </section>
    )
  } else if (existing.request) {
    content = (
      <section className={`panel ${styles.formCard}`}>
        <h2 className={styles.stepTitle}>Ya enviaste una solicitud para {pet.name}</h2>
        <p className={styles.stepLead}>La fundación la está revisando. Puedes ver en qué va y responder si te piden algo.</p>
        <div className="form-actions">
          <Link className="btn btn-secondary btn-lg" to={profileUrl}>
            <Icon name="chevron-left" /> Volver
          </Link>
          <Link className="btn btn-primary btn-lg" to={`/cuenta/solicitudes/backend/${existing.request.id}`}>
            Ver mi solicitud <Icon name="arrow-right" />
          </Link>
        </div>
      </section>
    )
  } else {
    content = (
      <form className={`panel ${styles.formCard}`} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.stepTitle}>Tus datos de contacto</h2>
        <p className={styles.stepLead}>La fundación te contactará con estos datos de tu cuenta.</p>
        <dl className={styles.contact}>
          <div>
            <dt>Nombre</dt>
            <dd>{fullName(user)}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Celular</dt>
            <dd>{user.phone ? formatPhone(user.phone) : 'Sin registrar'}</dd>
          </div>
        </dl>

        <h2 className={`${styles.stepTitle} ${styles.sectionTitle}`}>Tu hogar</h2>
        <Field label="¿En qué tipo de vivienda vives?" error={errors.tipoVivienda}>
          <div className={styles.optionGrid} role="radiogroup" aria-label="Tipo de vivienda">
            {housingTypes.map((option) => (
              <OptionCard
                key={option.value}
                name="tipoVivienda"
                value={option.value}
                checked={answers.tipoVivienda === option.value}
                onChange={(value) => set('tipoVivienda', value)}
                icon={option.icon}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </Field>
        <div className={styles.fields}>
          <Field label="La vivienda es…" error={errors.tenencia}>
            <SegmentedControl variant="buttons" label="Tenencia de la vivienda" options={['Propia', 'Arrendada']} value={answers.tenencia} onChange={(value) => set('tenencia', value)} />
          </Field>
          <Field label="¿Tiene patio o zona verde?" error={errors.tienePatio}>
            <SegmentedControl variant="buttons" label="¿Tiene patio o zona verde?" options={yesNo} value={answers.tienePatio} onChange={(value) => set('tienePatio', value)} />
          </Field>
          <Field label="¿Cuántas personas viven contigo?">
            <NumberStepper label="Personas en casa" value={answers.numeroConvivientes} min={1} max={15} onChange={(value) => set('numeroConvivientes', value)} />
          </Field>
          <Field label="¿Tienes otras mascotas?" error={errors.tieneOtraMascota}>
            <SegmentedControl variant="buttons" label="¿Tienes otras mascotas?" options={yesNo} value={answers.tieneOtraMascota} onChange={(value) => set('tieneOtraMascota', value)} />
          </Field>
        </div>
        {answers.tieneOtraMascota === 'Sí' && (
          <Field label="¿Qué mascotas tienes?" htmlFor="ap-other" error={errors.descripcionOtrasMascotas}>
            <input id="ap-other" className="input" name="descripcionOtrasMascotas" maxLength={500} placeholder="Ej.: una gata de 3 años, esterilizada" value={answers.descripcionOtrasMascotas} onChange={handleChange} aria-invalid={Boolean(errors.descripcionOtrasMascotas) || undefined} />
          </Field>
        )}

        <h2 className={`${styles.stepTitle} ${styles.sectionTitle}`}>Experiencia y rutina</h2>
        <Field label="¿Qué experiencia tienes cuidando mascotas?" htmlFor="ap-exp" error={errors.experienciaPrevia}>
          <textarea id="ap-exp" className="textarea" name="experienciaPrevia" rows={3} maxLength={500} placeholder="Cuéntanos si has tenido mascotas y cómo las cuidabas." value={answers.experienciaPrevia} onChange={handleChange} aria-invalid={Boolean(errors.experienciaPrevia) || undefined} />
        </Field>
        <Field label={`¿Cuántas horas al día puedes dedicarle a ${pet.name}?`}>
          <NumberStepper label="Horas al día" value={answers.horasDisponiblesDia} min={0} max={24} onChange={(value) => set('horasDisponiblesDia', value)} />
        </Field>

        <h2 className={`${styles.stepTitle} ${styles.sectionTitle}`}>Motivo y compromiso</h2>
        <Field label={`¿Por qué quieres adoptar a ${pet.name}?`} optional="(mínimo 30 caracteres)" htmlFor="ap-why" error={errors.motivoAdopcion}>
          <textarea id="ap-why" className="textarea" name="motivoAdopcion" rows={4} maxLength={500} placeholder="Cuéntale a la fundación cómo es tu día a día y por qué te encantó…" value={answers.motivoAdopcion} onChange={handleChange} aria-invalid={Boolean(errors.motivoAdopcion) || undefined} />
          <small className={styles.counter}>{answers.motivoAdopcion.length}/500</small>
        </Field>
        <div className={styles.commitments}>
          <label className="checkbox">
            <input type="checkbox" name="aceptaCompromisos" checked={answers.aceptaCompromisos} onChange={handleChange} />
            Me comprometo a darle vacunas, alimento y atención veterinaria, a no abandonarl{pet.sex === 'Hembra' ? 'a' : 'o'} y a permitir el seguimiento de la fundación.
          </label>
          {errors.aceptaCompromisos && <span className="field-error">{errors.aceptaCompromisos}</span>}
          <label className="checkbox">
            <input type="checkbox" name="autorizaDatos" checked={answers.autorizaDatos} onChange={handleChange} />
            Autorizo a {fundacion?.nombre ?? 'la fundación'} a usar mis datos y contactarme para este proceso de adopción.
          </label>
          {errors.autorizaDatos && <span className="field-error">{errors.autorizaDatos}</span>}
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            <Icon name="alert-circle" /> {serverError}
          </div>
        )}
        <div className="form-actions">
          <Link className="btn btn-secondary btn-lg" to={profileUrl}>
            <Icon name="chevron-left" /> Volver
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={sending} aria-busy={sending}>
            {sending ? 'Enviando…' : <>Enviar solicitud <Icon name="arrow-right" /></>}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="page page-tint-mint">
      <title>{`Solicitud para adoptar a ${pet.name} | PetMind`}</title>

      <div className="container">
        <Breadcrumbs items={[{ label: 'Adoptar', to: '/adoptar' }, { label: pet.name, to: profileUrl }, { label: 'Solicitud de adopción' }]} />
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Solicitud para adoptar a <span>{pet.name}</span>
            </h1>
            <p className={styles.lead}>Tus respuestas le llegan a la fundación, que puede aprobarla, pedirte más documentos o responderte.</p>
          </div>
        </div>

        <div className={styles.layout}>
          {content}

          <aside className={styles.aside}>
            <div className={styles.petCard}>
              <div className={styles.petPhoto}>
                {pet.photo ? <img src={pet.photo} alt={`Foto de ${pet.name}`} /> : <Icon name="image" />}
                <span className={styles.petScript}>
                  {pet.name} te espera <Icon name="heart" />
                </span>
              </div>
              <div className={styles.petBody}>
                <p className={styles.petName}>
                  <strong>{pet.name}</strong> {pet.sex && <SexBadge sex={pet.sex} size="sm" />}
                </p>
                <p className={styles.petMeta}>
                  {[pet.ageMonths == null ? null : formatAge(pet.ageMonths), sizeLabel(pet.size, pet.sex), pet.city].filter(Boolean).join(' · ')}
                </p>
                {fundacion && (
                  <p className={styles.petFoundation}>
                    <Avatar name={fundacion.nombre} src={fundacion.urlLogo || undefined} size="xs" shape="rounded" />
                    {fundacion.nombre}
                    {verified && <VerifiedBadge size="sm" />}
                  </p>
                )}
              </div>
            </div>

            <p className={`alert alert-warning ${styles.privacy}`}>
              <Icon name="shield-check" />
              Tus datos solo los verá la fundación y se usan únicamente para este proceso.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
