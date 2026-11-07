import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { SexBadge, VerifiedBadge } from '../../components/ui/Badges'
import { Breadcrumbs } from '../../components/ui/Navigation'
import { NumberStepper, RangeSlider, SegmentedControl } from '../../components/ui/Controls'
import { FormSteps } from '../../components/forms/Steppers'
import { Field, IconInput, SelectInput } from '../../components/forms/Field'
import { OptionCard } from '../../components/forms/OptionCard'
import { FileDropzone } from '../../components/forms/FileDropzone'
import NoEncontrada from '../NoEncontrada'
import { usePets } from '../../context/PetsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { useAuth } from '../../context/AuthContext'
import { useAdoptions } from '../../context/AdoptionsContext'
import { useToast } from '../../context/ToastContext'
import { isAdoptable, sizeLabel } from '../../data/pets'
import { cityNames } from '../../data/cities'
import { documentTypes } from '../../data/donations'
import { applicantFrom, budgetOptions, commitmentOptions, compatibilityScore, defaultAnswers, experienceOptions, genderize, housingSummary, neighborhoodFrom, validateAdoptionStep } from '../../utils/adoption'
import { formatAge, timeAgo } from '../../utils/dates'
import { formatPhone, maskDocument } from '../../utils/format'
import styles from './SolicitudAdopcion.module.css'

const steps = [
  { title: 'Sobre ti', subtitle: 'Datos personales' },
  { title: 'Tu hogar', subtitle: 'Vivienda y familia' },
  { title: 'Experiencia', subtitle: 'Cuidados y compromiso' },
  { title: 'Revisar y enviar', subtitle: 'Confirmar solicitud' },
]

const housingOptions = [
  { value: 'Casa', icon: 'home', description: 'Con o sin patio' },
  { value: 'Apartamento', icon: 'building', description: 'En edificio o unidad' },
  { value: 'Finca', icon: 'home', description: 'Zona rural' },
]

const yesNo = ['Sí', 'No']

// 02 · Adopción / 03 a 06 · Formulario de adopción en 4 pasos (el paso va en ?paso=)
export default function SolicitudAdopcion() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { getPetById } = usePets()
  const { getFoundationById } = useFoundations()
  const { user } = useAuth()
  const { getDraft, saveDraft, submitRequest } = useAdoptions()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const pet = getPetById(id)
  const draft = pet ? getDraft(user.id, pet.id) : null
  const [answers, setAnswers] = useState(() => ({ ...defaultAnswers(user), ...(draft?.answers ?? {}) }))
  const [maxStep, setMaxStep] = useState(() => draft?.draftStep ?? 1)
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState(draft ? draft.updatedAt : null)

  const requested = Number(params.get('paso')) || 1
  const step = Math.min(Math.max(requested, 1), maxStep, 4)

  // Borrador automático: un segundo después del último cambio.
  useEffect(() => {
    if (!dirty || !pet) return undefined
    const timer = window.setTimeout(() => {
      saveDraft({ userId: user.id, petId: pet.id, foundationId: pet.foundationId, applicant: applicantFrom(user, answers), answers, step: maxStep })
      setDirty(false)
      setSavedAt(new Date().toISOString())
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [answers, dirty, maxStep, pet, saveDraft, user])

  if (!pet) return <NoEncontrada title="No encontramos esta mascota" backTo="/adoptar" backLabel="Ver mascotas" />
  // También se bloquea si el equipo PetMind retiró la publicación.
  if (!isAdoptable(pet)) {
    return <NoEncontrada title={`${pet.name} ya no recibe solicitudes`} text="Puede que ya haya encontrado hogar. Mira otros peludos que te esperan." backTo="/adoptar" backLabel="Ver mascotas" />
  }

  const foundation = getFoundationById(pet.foundationId)

  function set(field, value) {
    setAnswers((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setDirty(true)
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    set(name, type === 'checkbox' ? checked : value)
  }

  function goTo(number) {
    setParams({ paso: String(number) })
    setErrors({})
  }

  function handleNext(event) {
    event.preventDefault()
    const newErrors = validateAdoptionStep(step, answers)
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      showToast('Revisa los campos marcados.', { tone: 'error' })
      return
    }

    if (step < 4) {
      const next = step + 1
      setMaxStep((prev) => Math.max(prev, next))
      saveDraft({ userId: user.id, petId: pet.id, foundationId: pet.foundationId, applicant: applicantFrom(user, answers), answers, step: Math.max(maxStep, next) })
      setSavedAt(new Date().toISOString())
      setDirty(false)
      goTo(next)
      return
    }

    setDirty(false)
    const request = submitRequest({
      userId: user.id,
      petId: pet.id,
      foundationId: pet.foundationId,
      applicant: applicantFrom(user, answers),
      answers,
      compatibility: compatibilityScore(answers, pet),
    })
    navigate(`/cuenta/solicitudes/${request.id}/enviada`, { replace: true })
  }

  const accepted = Object.values(answers.commitments).filter(Boolean).length

  return (
    <div className="page page-tint-mint">
      <title>{`Solicitud para adoptar a ${pet.name} | PetMind`}</title>

      <div className="container">
        <Breadcrumbs items={[{ label: 'Adoptar', to: '/adoptar' }, { label: pet.name, to: `/adoptar/${pet.id}` }, { label: 'Solicitud de adopción' }]} />
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Solicitud para adoptar a <span>{pet.name}</span>
            </h1>
            <p className={styles.lead}>Paso {step} de 4 · Tus respuestas ayudan a la fundación a encontrar el mejor hogar.</p>
          </div>
          <p className={styles.saved} aria-live="polite">
            <span className={styles.savedDot} />
            {dirty ? 'Guardando borrador…' : savedAt ? `Borrador guardado ${timeAgo(savedAt) === 'justo ahora' ? 'automáticamente' : timeAgo(savedAt)}` : 'Borrador guardado automáticamente'}
          </p>
        </div>

        <FormSteps steps={steps} current={step} onStepClick={goTo} />

        <div className={styles.layout}>
          <form className={`panel ${styles.formCard}`} onSubmit={handleNext} noValidate>
            {step === 1 && (
              <>
                <h2 className={styles.stepTitle}>Cuéntanos sobre ti</h2>
                <p className={styles.stepLead}>Tomamos algunos datos de tu perfil. Revisa que estén correctos.</p>
                <div className={styles.fields}>
                  <Field label="Nombre completo" htmlFor="ad-name" error={errors.fullName}>
                    <input id="ad-name" className="input" name="fullName" value={answers.fullName} onChange={handleChange} aria-invalid={Boolean(errors.fullName) || undefined} />
                  </Field>
                  <Field label="Documento de identidad" htmlFor="ad-doc" error={errors.docNumber}>
                    <div className={styles.docGroup}>
                      <select className={`select ${styles.docType}`} name="docType" value={answers.docType} onChange={handleChange} aria-label="Tipo de documento">
                        {documentTypes
                          .filter((type) => type.value !== 'NIT')
                          .map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.value}
                            </option>
                          ))}
                      </select>
                      <input
                        id="ad-doc"
                        className={`input ${styles.docNumber}`}
                        name="docNumber"
                        inputMode="numeric"
                        placeholder="Número de documento"
                        value={answers.docNumber}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.docNumber) || undefined}
                      />
                    </div>
                  </Field>
                  <Field label="Fecha de nacimiento" htmlFor="ad-birth" error={errors.birthDate}>
                    <IconInput id="ad-birth" icon="calendar" type="date" name="birthDate" value={answers.birthDate} onChange={handleChange} invalid={Boolean(errors.birthDate)} />
                  </Field>
                  <Field label="Ocupación" htmlFor="ad-job" error={errors.occupation}>
                    <input id="ad-job" className="input" name="occupation" placeholder="¿A qué te dedicas?" value={answers.occupation} onChange={handleChange} aria-invalid={Boolean(errors.occupation) || undefined} />
                  </Field>
                  <Field label="Celular" htmlFor="ad-phone" error={errors.phone}>
                    <IconInput id="ad-phone" icon="phone" type="tel" inputMode="numeric" name="phone" value={answers.phone} onChange={handleChange} invalid={Boolean(errors.phone)} />
                  </Field>
                  <Field label="Correo electrónico" htmlFor="ad-email" error={errors.email}>
                    <IconInput id="ad-email" icon="mail" type="email" name="email" value={answers.email} onChange={handleChange} invalid={Boolean(errors.email)} />
                  </Field>
                  <Field label="Ciudad" htmlFor="ad-city" error={errors.city}>
                    <SelectInput id="ad-city" icon="map-pin" name="city" value={answers.city} onChange={handleChange} invalid={Boolean(errors.city)}>
                      <option value="">Elige tu ciudad</option>
                      {cityNames.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Barrio y dirección" htmlFor="ad-address" error={errors.address}>
                    <input id="ad-address" className="input" name="address" placeholder="Laureles, Cra. 76 # 35-20" value={answers.address} onChange={handleChange} aria-invalid={Boolean(errors.address) || undefined} />
                  </Field>
                </div>
                <Field label={`¿Por qué quieres adoptar a ${pet.name}?`} optional="(mínimo 50 caracteres)" htmlFor="ad-why" error={errors.motivation}>
                  <textarea
                    id="ad-why"
                    className="textarea"
                    name="motivation"
                    maxLength={500}
                    placeholder="Cuéntale a la fundación cómo es tu día a día y por qué te encantó…"
                    value={answers.motivation}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.motivation) || undefined}
                  />
                  <span className={styles.counter}>{answers.motivation.length} / 500</span>
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className={styles.stepTitle}>Háblanos de tu hogar</h2>
                <p className={styles.stepLead}>Así la fundación sabe si {pet.name} tendrá un espacio seguro y cómodo.</p>

                <Field label="¿En qué tipo de vivienda vives?" error={errors.housingType}>
                  <div className={styles.optionGrid} role="radiogroup" aria-label="Tipo de vivienda">
                    {housingOptions.map((option) => (
                      <OptionCard
                        key={option.value}
                        name="housingType"
                        value={option.value}
                        checked={answers.housingType === option.value}
                        onChange={(value) => set('housingType', value)}
                        icon={option.icon}
                        title={option.value}
                        description={option.description}
                      />
                    ))}
                  </div>
                </Field>

                <div className={styles.fields}>
                  <Field label="La vivienda es..." error={errors.housingTenure}>
                    <SegmentedControl
                      label="La vivienda es"
                      options={['Propia', 'Arrendada', 'Familiar']}
                      value={answers.housingTenure}
                      onChange={(value) => {
                        set('housingTenure', value)
                        if (value !== 'Arrendada') set('landlordAllows', '')
                      }}
                    />
                  </Field>
                  <Field label="¿El arrendador permite mascotas?" error={errors.landlordAllows}>
                    <SegmentedControl
                      variant="buttons"
                      label="¿El arrendador permite mascotas?"
                      options={['Sí', 'No', 'No sé']}
                      value={answers.landlordAllows}
                      onChange={(value) => set('landlordAllows', value)}
                      disabled={answers.housingTenure !== 'Arrendada'}
                    />
                  </Field>
                  <Field label="¿Cuántas personas viven contigo?">
                    <NumberStepper label="Personas en casa" value={answers.people} min={1} max={15} onChange={(value) => set('people', value)} />
                  </Field>
                  <Field label="¿Hay niños en casa?" error={errors.kids}>
                    <SegmentedControl variant="buttons" label="¿Hay niños en casa?" options={yesNo} value={answers.kids} onChange={(value) => set('kids', value)} />
                  </Field>
                  <Field label="¿Tienes otras mascotas?" error={errors.otherPets}>
                    <SegmentedControl variant="buttons" label="¿Tienes otras mascotas?" options={yesNo} value={answers.otherPets} onChange={(value) => set('otherPets', value)} />
                  </Field>
                </div>

                {answers.landlordAllows === 'No' && (
                  <div className="alert alert-warning">
                    <Icon name="info" /> La fundación podría pedirte el permiso del arrendador antes de la visita.
                  </div>
                )}

                <Field label={`Fotos del espacio donde vivirá ${pet.name}`} optional="(opcional, ayuda mucho)">
                  <div className={styles.photos}>
                    {answers.spacePhotos.map((photo, index) => (
                      <div key={`${photo.name}-${index}`} className={styles.photoTile}>
                        {photo.url ? <img src={photo.url} alt={photo.name} /> : <Icon name="home" />}
                        <span>{photo.name}</span>
                        <button
                          type="button"
                          className={styles.photoRemove}
                          onClick={() => set('spacePhotos', answers.spacePhotos.filter((_, i) => i !== index))}
                          aria-label={`Quitar ${photo.name}`}
                        >
                          <Icon name="x" strokeWidth={2.4} />
                        </button>
                      </div>
                    ))}
                    <FileDropzone className={styles.photoDrop} onFiles={(files) => set('spacePhotos', [...answers.spacePhotos, ...files].slice(0, 6))} />
                  </div>
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className={styles.stepTitle}>Experiencia y compromiso</h2>
                <p className={styles.stepLead}>No hay respuestas malas: queremos conocerte y acompañarte.</p>

                <Field label="¿Has tenido mascotas antes?" error={errors.experience}>
                  <div className={styles.optionGrid} role="radiogroup" aria-label="Experiencia previa">
                    {experienceOptions.map((option) => (
                      <OptionCard
                        key={option.value}
                        layout="plain"
                        name="experience"
                        value={option.value}
                        checked={answers.experience === option.value}
                        onChange={(value) => set('experience', value)}
                        title={option.value}
                        description={option.description}
                      />
                    ))}
                  </div>
                </Field>

                <Field label={genderize(`¿Cuántas horas al día pasaría ${pet.name} {sola}?`, pet.sex)}>
                  <RangeSlider
                    label="Horas sola al día"
                    min={0}
                    max={12}
                    value={answers.hoursAlone}
                    onChange={(value) => set('hoursAlone', value)}
                    format={(value) => `${value} ${value === 1 ? 'hora' : 'horas'}`}
                    marks={['0 h', '4 h', '8 h', '12 h']}
                  />
                </Field>

                <div className={styles.fields}>
                  <Field label={genderize('Si viajas, ¿quién {la} cuidaría?', pet.sex)} htmlFor="ad-travel" error={errors.travelCare}>
                    <input id="ad-travel" className="input" name="travelCare" placeholder="Ej.: mi mamá, vive cerca" value={answers.travelCare} onChange={handleChange} aria-invalid={Boolean(errors.travelCare) || undefined} />
                  </Field>
                  <Field label={`Presupuesto mensual para ${pet.name}`} error={errors.budget}>
                    <SegmentedControl label="Presupuesto mensual" options={budgetOptions} value={answers.budget} onChange={(value) => set('budget', value)} />
                  </Field>
                </div>

                <Field label="Me comprometo a..." error={errors.commitments}>
                  <div className={styles.commitments}>
                    {commitmentOptions.map((item) => (
                      <label key={item.key} className="checkbox">
                        <input
                          type="checkbox"
                          checked={answers.commitments[item.key]}
                          onChange={(event) => set('commitments', { ...answers.commitments, [item.key]: event.target.checked })}
                        />
                        {genderize(item.label, pet.sex)}
                      </label>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className={styles.stepTitle}>Revisa tu solicitud</h2>
                <p className={styles.stepLead}>Verifica que todo esté bien antes de enviarla a la fundación.</p>

                <div className={styles.review}>
                  <ReviewSection title="Sobre ti" onEdit={() => goTo(1)}>
                    <ReviewItem label="Nombre" value={answers.fullName} />
                    <ReviewItem label="Documento" value={`${answers.docType} ${maskDocument(answers.docNumber)}`} />
                    <ReviewItem label="Celular" value={formatPhone(answers.phone)} />
                    <ReviewItem label="Ciudad" value={`${answers.city} · ${neighborhoodFrom(answers.address)}`} />
                    <ReviewItem label="Ocupación" value={answers.occupation} />
                    <ReviewItem label="Correo" value={answers.email} />
                  </ReviewSection>
                  <ReviewSection title="Tu hogar" onEdit={() => goTo(2)}>
                    <ReviewItem label="Vivienda" value={housingSummary(answers)} />
                    <ReviewItem label="Permite mascotas" value={answers.housingTenure === 'Arrendada' ? answers.landlordAllows : 'No aplica'} />
                    <ReviewItem label="Personas en casa" value={answers.people} />
                    <ReviewItem label="Niños" value={answers.kids} />
                    <ReviewItem label="Otras mascotas" value={answers.otherPets} />
                    <ReviewItem label="Fotos" value={answers.spacePhotos.length ? `${answers.spacePhotos.length} ${answers.spacePhotos.length === 1 ? 'foto adjunta' : 'fotos adjuntas'}` : 'Sin fotos'} />
                  </ReviewSection>
                  <ReviewSection title="Experiencia y compromiso" onEdit={() => goTo(3)}>
                    <ReviewItem label="Experiencia" value={answers.experience} />
                    <ReviewItem label="Horas sola" value={`${answers.hoursAlone} horas al día`} />
                    <ReviewItem label="Presupuesto" value={answers.budget} />
                    <ReviewItem label="En viajes" value={answers.travelCare} />
                    <ReviewItem label="Compromisos" value={`${accepted} de 4 aceptados`} />
                  </ReviewSection>
                </div>

                <div className="field">
                  <label className="checkbox">
                    <input type="checkbox" name="confirm" checked={answers.confirm} onChange={handleChange} />
                    Confirmo que la información es verídica y autorizo a la Fundación {foundation?.name} a contactarme para continuar el proceso.
                  </label>
                  {errors.confirm && <span className="field-error">{errors.confirm}</span>}
                </div>
              </>
            )}

            <div className="form-actions">
              {step > 1 ? (
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => goTo(step - 1)}>
                  <Icon name="chevron-left" /> Anterior
                </button>
              ) : (
                <span className="form-actions-note">Puedes salir y continuar después</span>
              )}
              {step > 1 && step < 4 && <span className="form-actions-note">Puedes salir y continuar después</span>}
              <button type="submit" className="btn btn-primary btn-lg">
                {step < 4 ? 'Continuar' : 'Enviar solicitud'} <Icon name="arrow-right" />
              </button>
            </div>
          </form>

          <aside className={styles.aside}>
            <div className={styles.petCard}>
              <div className={styles.petPhoto}>
                <img src={pet.photo} alt={`Foto de ${pet.name}`} />
                <span className={styles.petScript}>
                  {pet.name} te espera <Icon name="heart" />
                </span>
              </div>
              <div className={styles.petBody}>
                <p className={styles.petName}>
                  <strong>{pet.name}</strong> <SexBadge sex={pet.sex} size="sm" />
                </p>
                <p className={styles.petMeta}>
                  {formatAge(pet.ageMonths)} · {sizeLabel(pet.size, pet.sex)} · {pet.city}
                </p>
                {foundation && (
                  <p className={styles.petFoundation}>
                    <Avatar initials={foundation.initials} color={foundation.color} size="xs" shape="rounded" />
                    {foundation.name}
                    {foundation.verified && <VerifiedBadge size="sm" />}
                  </p>
                )}
              </div>
            </div>

            <div className={`panel panel-sm ${styles.help}`}>
              <h2>¿Necesitas ayuda?</h2>
              <p>Si tienes dudas sobre alguna pregunta, la fundación te puede orientar.</p>
              <div className={styles.helpActions}>
                <Link className="btn btn-secondary" to={`/contacto?tema=Adopciones&asunto=${encodeURIComponent(`Solicitud para ${pet.name}`)}`}>
                  <Icon name="message" /> Chat
                </Link>
                <a className="btn btn-secondary" href={`tel:${(foundation?.contact?.phone ?? '').replace(/\s/g, '')}`}>
                  <Icon name="phone" /> Llamar
                </a>
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

function ReviewSection({ title, onEdit, children }) {
  return (
    <section className={styles.reviewSection}>
      <header>
        <span className={styles.reviewCheck}>
          <Icon name="check" strokeWidth={3} />
        </span>
        <h3>{title}</h3>
        <button type="button" className={`link-button ${styles.reviewEdit}`} onClick={onEdit}>
          <Icon name="edit" /> Editar
        </button>
      </header>
      <dl>{children}</dl>
    </section>
  )
}

function ReviewItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}
