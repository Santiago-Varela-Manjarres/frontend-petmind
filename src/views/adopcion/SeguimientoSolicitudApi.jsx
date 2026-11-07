import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { StatusPill, VerifiedBadge } from '../../components/ui/Badges'
import { Breadcrumbs } from '../../components/ui/Navigation'
import { Field } from '../../components/forms/Field'
import NoEncontrada from '../NoEncontrada'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { obtenerSolicitud, responderSolicitud } from '../../services/solicitudesService'
import { obtenerFundacion } from '../../services/fundacionesService'
import { fotosPorMascota, listarArchivos } from '../../services/archivosService'
import { closedStatuses, formatApiDate, homeRows, statusOf } from '../../services/solicitudMapper'
import styles from './SeguimientoSolicitud.module.css'

function timelineOf(request) {
  const closed = closedStatuses.includes(request.estado)
  const reviewing = !closed
  const decisionTitle = request.estado === 'APROBADA' ? '¡Adopción aprobada!' : request.estado === 'RECHAZADA' ? 'Solicitud no aprobada' : 'Decisión de la fundación'
  return [
    { title: 'Solicitud enviada', icon: 'send', date: request.fechaSolicitud, state: 'done', text: 'Tus respuestas le llegaron a la fundación.' },
    {
      title: request.estado === 'DOCUMENTOS_PENDIENTES' ? 'La fundación pidió más documentos' : 'En revisión',
      icon: request.estado === 'DOCUMENTOS_PENDIENTES' ? 'file' : 'clock',
      date: request.fechaEnRevision,
      state: closed ? 'done' : 'current',
      text: statusOf(request.estado).text,
    },
    { title: decisionTitle, icon: 'heart', date: request.fechaDecision, state: closed ? 'done' : 'pending', text: reviewing ? 'Te avisaremos aquí cuando la fundación decida.' : statusOf(request.estado).text },
  ]
}

// 02 · Adopción · Seguimiento de una solicitud guardada en el backend.
export default function SeguimientoSolicitudApi() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [state, setState] = useState({ id: null, status: 'loading', request: null })
  const [extra, setExtra] = useState({ photo: null, foundation: null })
  const [reply, setReply] = useState('')
  const [replyError, setReplyError] = useState('')
  const [sending, setSending] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    obtenerSolicitud(id)
      .then((request) => {
        if (active) setState({ id, status: 'success', request })
      })
      .catch((error) => {
        if (active) setState({ id, status: error.status === 404 ? 'missing' : 'error', request: null })
      })
    return () => {
      active = false
    }
  }, [id, attempt])

  const request = state.id === id ? state.request : null
  const mascotaId = request?.mascotaId
  const fundacionId = request?.fundacionId
  useEffect(() => {
    if (mascotaId == null) return undefined
    let active = true
    Promise.all([
      listarArchivos().then((archivos) => fotosPorMascota(archivos).get(String(mascotaId)) ?? null).catch(() => null),
      fundacionId == null ? null : obtenerFundacion(fundacionId).catch(() => null),
    ]).then(([photo, foundation]) => {
      if (active) setExtra({ photo, foundation })
    })
    return () => {
      active = false
    }
  }, [mascotaId, fundacionId])

  if (state.id !== id || state.status === 'loading') return <div className="page container" role="status">Cargando tu solicitud…</div>
  if (state.status === 'error') {
    return (
      <div className="page container" role="alert">
        <p>No fue posible cargar la solicitud.</p>
        <button type="button" className="btn btn-outline" onClick={() => setAttempt((value) => value + 1)}>Reintentar</button>
      </div>
    )
  }
  // Solo la persona que la envió puede verla.
  if (!request || request.usuarioId !== user.backendId) {
    return <NoEncontrada title="No encontramos esta solicitud" backTo="/cuenta/solicitudes" backLabel="Ver mis solicitudes" />
  }

  const status = statusOf(request.estado)
  const petName = request.mascotaNombre ?? 'tu mascota'
  const { photo, foundation } = extra
  const foundationName = foundation?.nombre ?? 'La fundación'
  const foundationEmail = foundation?.contacto?.emailContacto

  async function handleReply(event) {
    event.preventDefault()
    if (sending) return
    if (reply.trim().length < 5) {
      setReplyError('Cuéntale a la fundación qué le envías (mínimo 5 caracteres).')
      return
    }
    setSending(true)
    setReplyError('')
    try {
      const updated = await responderSolicitud(request.id, { usuarioId: user.backendId, respuesta: reply.trim() })
      setState({ id, status: 'success', request: updated })
      setReply('')
      showToast('Le enviamos tu respuesta a la fundación.', { tone: 'success' })
    } catch (error) {
      setReplyError(error.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="page">
      <title>{`Adopción de ${petName} | PetMind`}</title>

      <div className="container">
        <Breadcrumbs items={[{ label: 'Mi cuenta', to: '/cuenta' }, { label: 'Mis solicitudes', to: '/cuenta/solicitudes' }, { label: `#${request.id}` }]} />

        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h1>
              Adopción de <span>{petName}</span>
            </h1>
            <StatusPill tone={status.tone} size="lg">
              {status.label}
            </StatusPill>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAnswers((prev) => !prev)} aria-expanded={showAnswers}>
              <Icon name="file" /> {showAnswers ? 'Ocultar mi solicitud' : 'Ver mi solicitud'}
            </button>
          </div>
        </div>

        {showAnswers && (
          <section className={`panel ${styles.answers}`}>
            <h2>Tus respuestas</h2>
            <dl>
              {homeRows(request.datosHogar).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className={styles.layout}>
          <section className={`panel ${styles.timelineCard}`}>
            <h2 className={styles.cardTitle}>Estado de tu solicitud</h2>

            {request.estado === 'APROBADA' && (
              <div className={`alert alert-success ${styles.result}`} role="status">
                <Icon name="heart-filled" />
                <span>
                  ¡{foundationName} aprobó la adopción de {petName}! Te contactará para coordinar la entrega.
                  {request.mensajeFundacion ? ` “${request.mensajeFundacion}”` : ''}
                </span>
              </div>
            )}
            {request.estado === 'RECHAZADA' && (
              <div className={`alert alert-error ${styles.result}`} role="status">
                <Icon name="info" />
                <span>{request.mensajeFundacion ? `“${request.mensajeFundacion}” — ${foundationName}` : status.text}</span>
              </div>
            )}

            {request.estado === 'DOCUMENTOS_PENDIENTES' && (
              <div className={`alert alert-warning ${styles.result}`} role="status">
                <Icon name="file" />
                <div>
                  <strong>{foundationName} necesita más información</strong>
                  <p>“{request.mensajeFundacion}”</p>
                </div>
              </div>
            )}

            <ol className={styles.timeline}>
              {timelineOf(request).map((item) => (
                <li key={item.title} className={`${styles.event} ${styles[item.state]}`}>
                  <span className={styles.eventIcon}>
                    <Icon name={item.icon} />
                  </span>
                  <div className={styles.eventBody}>
                    <h3>
                      {item.title}
                      {item.state === 'current' && <span className={styles.here}>Estás aquí</span>}
                    </h3>
                    {item.state === 'done' && item.date && <p className={styles.eventDate}>{formatApiDate(item.date)}</p>}
                    {item.state === 'pending' && <p className={styles.eventDate}>Pendiente</p>}
                    <p className={styles.eventText}>{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            {request.estado === 'DOCUMENTOS_PENDIENTES' && (
              <form className={styles.replyForm} onSubmit={handleReply} noValidate>
                <Field
                  label="Responde a la fundación"
                  htmlFor="reply"
                  error={replyError}
                  hint={`Pega enlaces a tus documentos (Drive, OneDrive…)${foundationEmail ? ` o cuéntale que los enviaste a ${foundationEmail}` : ''}.`}
                >
                  <textarea id="reply" className="textarea" rows={4} maxLength={2000} value={reply} onChange={(event) => setReply(event.target.value)} aria-invalid={Boolean(replyError) || undefined} />
                </Field>
                <button type="submit" className="btn btn-primary" disabled={sending} aria-busy={sending}>
                  {sending ? 'Enviando…' : <>Enviar respuesta <Icon name="send" /></>}
                </button>
              </form>
            )}

            {request.respuestaAdoptante && request.estado !== 'DOCUMENTOS_PENDIENTES' && (
              <div className={`alert alert-neutral ${styles.result}`}>
                <Icon name="message" />
                <div>
                  <strong>Tu respuesta a la fundación</strong>
                  <p>{request.respuestaAdoptante}</p>
                </div>
              </div>
            )}
          </section>

          <aside className={styles.aside}>
            <div className={`panel panel-sm ${styles.petCard}`}>
              {photo ? <img src={photo} alt={`Foto de ${petName}`} /> : <span className={styles.petPhotoEmpty}><Icon name="image" /></span>}
              <div>
                <p className={styles.petName}>
                  <strong>{petName}</strong>
                </p>
                <p className={styles.petMeta}>Solicitud enviada el {formatApiDate(request.fechaSolicitud)}</p>
                {request.estado !== 'APROBADA' && (
                  <Link className="link" to={`/adoptar/backend/${request.mascotaId}`}>
                    Ver perfil
                  </Link>
                )}
              </div>
            </div>

            {foundation && (
              <section className={`panel panel-sm ${styles.docs}`}>
                <h2>
                  <Avatar name={foundation.nombre} src={foundation.urlLogo || undefined} size="xs" shape="rounded" /> {foundation.nombre}{' '}
                  {foundation.estadoVerificacion === 'VERIFICADA' && <VerifiedBadge />}
                </h2>
                <ul>
                  {foundationEmail && (
                    <li>
                      <span className="icon-tile icon-tile-info">
                        <Icon name="mail" />
                      </span>
                      <a className={styles.docName} href={`mailto:${foundationEmail}`}>{foundationEmail}</a>
                    </li>
                  )}
                  {foundation.contacto?.telefonoPrincipal && (
                    <li>
                      <span className="icon-tile icon-tile-info">
                        <Icon name="phone" />
                      </span>
                      <a className={styles.docName} href={`tel:${foundation.contacto.telefonoPrincipal}`}>{foundation.contacto.telefonoPrincipal}</a>
                    </li>
                  )}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
