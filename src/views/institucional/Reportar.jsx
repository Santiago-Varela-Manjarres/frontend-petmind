import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field, IconInput } from '../../components/forms/Field'
import { FileDropzone } from '../../components/forms/FileDropzone'
import { SegmentedControl } from '../../components/ui/Controls'
import Icon from '../../components/ui/Icon'
import { Breadcrumbs } from '../../components/ui/Navigation'
import { useAuth } from '../../context/AuthContext'
import { useFoundations } from '../../context/FoundationsContext'
import { useReports } from '../../context/ReportsContext'
import { useToast } from '../../context/ToastContext'
import { emergencyLines, reportTypes, urgencyLevels } from '../../data/reports'
import styles from './Institucional.module.css'

const initial = {
  type: 'herido',
  species: 'Perro',
  urgency: 'media',
  address: '',
  description: '',
  name: '',
  phone: '',
  anonymous: false,
  photos: [],
}

export default function Reportar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { foundations } = useFoundations()
  const { addReport } = useReports()
  const { showToast } = useToast()
  const [form, setForm] = useState({
    ...initial,
    name: user ? [user.name, user.lastName].filter(Boolean).join(' ') : '',
    phone: user?.phone ?? '',
  })
  const [errors, setErrors] = useState({})
  const [linesOpen, setLinesOpen] = useState(false)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  // No es un hook: se llama shareLocation para no confundirlo con useLocation de React Router.
  function shareLocation() {
    if (!navigator.geolocation) {
      showToast('Este navegador no permite compartir la ubicación.', { tone: 'info' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update('address', `Ubicación compartida · ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`)
        showToast('Ubicación agregada al reporte.', { tone: 'success' })
      },
      () => showToast('No pudimos obtener tu ubicación. Escríbela manualmente.', { tone: 'error' }),
      { timeout: 8000 },
    )
  }

  function submit(event) {
    event.preventDefault()
    const next = {}
    if (!form.type) next.type = 'Selecciona el tipo de situación.'
    if (!form.address.trim()) next.address = 'Indica dónde se encuentra el animal.'
    if (form.description.trim().length < 20) next.description = 'Describe la situación con al menos 20 caracteres.'
    if (!form.anonymous && !form.name.trim()) next.name = 'Escribe tu nombre o marca el envío anónimo.'
    if (!form.anonymous && form.phone.replace(/\D/g, '').length < 7)
      next.phone = 'Escribe un número de contacto válido.'
    setErrors(next)
    if (Object.keys(next).length) return

    const nearby = foundations.filter((foundation) => foundation.verified).slice(0, 3)
    const report = addReport({
      type: form.type,
      species: form.species,
      urgency: form.urgency,
      address: form.address.trim(),
      description: form.description.trim(),
      photos: form.photos,
      contact: { name: form.anonymous ? 'Anónimo' : form.name.trim(), phone: form.anonymous ? '' : form.phone },
      anonymous: form.anonymous,
      userId: form.anonymous ? null : (user?.id ?? null),
      notified: nearby.map((foundation, index) => ({
        foundationId: foundation.id,
        distance: ['2,4 km', '4,8 km', '7,2 km'][index],
        status: 'notificada',
      })),
    })
    navigate(`/reportar/enviado/${report.id}`)
  }

  return (
    <main className={`page page-tint-peach ${styles.reportPage}`}>
      <title>Reportar un animal en riesgo | PetMind</title>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Reportar un animal en riesgo' }]} />
        <div className={styles.emergencyNotice}>
          <span className="icon-tile icon-tile-solid-accent">
            <Icon name="zap" />
          </span>
          <div>
            <strong>¿Es una emergencia con riesgo para la vida del animal o de personas?</strong>
            <p>Llama primero a las autoridades o a la línea de protección animal de tu ciudad.</p>
          </div>
          <a className="btn btn-accent-soft" href="tel:123">
            <Icon name="phone" />
            Línea 123
          </a>
          <button type="button" className="btn btn-accent-soft" onClick={() => setLinesOpen((open) => !open)}>
            Líneas por ciudad
          </button>
        </div>
        {linesOpen && (
          <div className={styles.linesList}>
            {emergencyLines.map((item) => (
              <p key={item.city}>
                <strong>{item.city}:</strong> {item.line}
              </p>
            ))}
          </div>
        )}
        <header className={styles.reportHeading}>
          <h1>
            Reporta un animal <span>que necesita ayuda</span>
          </h1>
          <p>Avisaremos a las fundaciones verificadas más cercanas. Puedes hacerlo de forma anónima.</p>
        </header>
        <div className={styles.reportGrid}>
          <form className={`panel ${styles.reportForm}`} onSubmit={submit} noValidate>
            <section>
              <h2>
                <b>1</b>¿Qué está pasando?
              </h2>
              <div className={styles.reportTypes}>
                {reportTypes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`${styles.reportType} ${form.type === item.value ? styles.reportTypeActive : ''}`}
                    onClick={() => update('type', item.value)}
                    aria-pressed={form.type === item.value}
                  >
                    <span>
                      <Icon name={item.icon} />
                    </span>
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>
              {errors.type && <span className="field-error">{errors.type}</span>}
            </section>
            <div className={styles.controlRow}>
              <section>
                <h2>
                  <b>2</b>Especie
                </h2>
                <SegmentedControl
                  options={['Perro', 'Gato', 'Otro']}
                  value={form.species}
                  onChange={(value) => update('species', value)}
                  label="Especie"
                />
              </section>
              <section>
                <h2>
                  <b>3</b>Nivel de urgencia
                </h2>
                <SegmentedControl
                  variant="buttons"
                  options={urgencyLevels.map((item) => ({ value: item.value, label: item.label, dot: item.tone }))}
                  value={form.urgency}
                  onChange={(value) => update('urgency', value)}
                  label="Nivel de urgencia"
                />
              </section>
            </div>
            <section>
              <h2>
                <b>4</b>¿Dónde está?
              </h2>
              <Field htmlFor="report-address" error={errors.address}>
                <IconInput
                  id="report-address"
                  icon="map-pin"
                  placeholder="Dirección o punto de referencia"
                  value={form.address}
                  onChange={(event) => update('address', event.target.value)}
                  aria-invalid={Boolean(errors.address)}
                />
              </Field>
              <div className={styles.reportMap} role="img" aria-label="Mapa ilustrado de la ubicación del animal">
                <span className={styles.roadOne} />
                <span className={styles.roadTwo} />
                <span className={styles.mapRadius} />
                <span className={styles.mapPin}>
                  <Icon name="map-pin" />
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={shareLocation}>
                  <Icon name="map-pin" />
                  Usar mi ubicación
                </button>
              </div>
            </section>
            <section>
              <h2>
                <b>5</b>Fotos o video
              </h2>
              <div className={styles.uploadRow}>
                {form.photos.slice(0, 3).map((photo, index) =>
                  photo.url ? (
                    <div className={styles.photoThumb} key={`${photo.name}-${index}`}>
                      <img src={photo.url} alt={photo.name} />
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            'photos',
                            form.photos.filter((_, item) => item !== index),
                          )
                        }
                        aria-label={`Quitar ${photo.name}`}
                      >
                        <Icon name="x" />
                      </button>
                    </div>
                  ) : null,
                )}
                <FileDropzone
                  tone="accent"
                  accept="image/*,video/*"
                  title="Agregar más fotos"
                  hint="Ayudan a evaluar la gravedad"
                  onFiles={(files) => update('photos', [...form.photos, ...files])}
                />
              </div>
            </section>
            <section>
              <h2>
                <b>6</b>Describe la situación
              </h2>
              <Field htmlFor="report-description" error={errors.description}>
                <textarea
                  id="report-description"
                  className="textarea"
                  placeholder="Cuéntanos qué observaste, desde cuándo y en qué estado está…"
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  aria-invalid={Boolean(errors.description)}
                />
              </Field>
            </section>
            <section>
              <h2>
                <b>7</b>Tus datos de contacto
              </h2>
              <div className="form-row">
                <Field label="Nombre" htmlFor="report-name" error={errors.name}>
                  <input
                    id="report-name"
                    className="input"
                    value={form.anonymous ? '' : form.name}
                    disabled={form.anonymous}
                    onChange={(event) => update('name', event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                  />
                </Field>
                <Field label="Celular" htmlFor="report-phone" error={errors.phone}>
                  <IconInput
                    id="report-phone"
                    icon="phone"
                    value={form.anonymous ? '' : form.phone}
                    disabled={form.anonymous}
                    onChange={(event) => update('phone', event.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                  />
                </Field>
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.anonymous}
                  onChange={(event) => {
                    update('anonymous', event.target.checked)
                    if (event.target.checked) setErrors((current) => ({ ...current, name: '', phone: '' }))
                  }}
                />
                Enviar el reporte de forma anónima
              </label>
            </section>
            <button type="submit" className="btn btn-accent btn-block btn-lg">
              <Icon name="send" />
              Enviar reporte
            </button>
          </form>
          <aside className={styles.reportAside}>
            <section className="panel panel-sm">
              <h2>¿Qué pasa después?</h2>
              <ol>
                {[
                  ['Recibimos tu reporte', 'Te damos un código para seguirlo.'],
                  ['Avisamos a fundaciones cercanas', 'Las que estén a menos de 10 km.'],
                  ['Una fundación toma el caso', 'Te avisamos cuando esté en camino.'],
                ].map(([title, text], index) => (
                  <li key={title}>
                    <b>{index + 1}</b>
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <div className={`alert alert-warning ${styles.careTip}`}>
              <div>
                <strong>Mientras llega la ayuda</strong>
                <p>
                  Si es seguro, ofrécele agua y sombra. No lo fuerces a moverse si está herido y mantén una distancia
                  prudente.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
