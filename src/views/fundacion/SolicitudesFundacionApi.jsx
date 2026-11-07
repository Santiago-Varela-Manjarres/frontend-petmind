import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { StatusPill } from '../../components/ui/Badges'
import { Tabs } from '../../components/ui/Navigation'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { cambiarEstadoSolicitud, listarSolicitudesDeFundacion } from '../../services/solicitudesService'
import { fotosPorMascota, listarArchivos } from '../../services/archivosService'
import { apiDate, formatApiDate, homeRows, statusOf } from '../../services/solicitudMapper'
import { formatPhone } from '../../utils/format'
import panelStyles from './Fundacion.module.css'
import styles from './SolicitudesFundacionApi.module.css'

const filters = [
  { value: 'abiertas', label: 'Por revisar', states: ['PENDIENTE', 'ENVIADA', 'EN_REVISION', 'ENTREVISTA', 'VISITA_HOGAR'] },
  { value: 'documentos', label: 'Esperando documentos', states: ['DOCUMENTOS_PENDIENTES'] },
  { value: 'aprobadas', label: 'Aprobadas', states: ['APROBADA'] },
  { value: 'rechazadas', label: 'No aprobadas', states: ['RECHAZADA', 'CANCELADA'] },
]

const isOpen = (request) => !['APROBADA', 'RECHAZADA', 'CANCELADA'].includes(request.estado)
const applicantName = (request) => [request.solicitante?.nombre, request.solicitante?.apellido].filter(Boolean).join(' ') || `Persona #${request.usuarioId}`

// Panel de la fundación para cuentas del backend (representante de una fundación de la API).
// Las solicitudes vienen de GET /solicitudes-adopcion/por-fundacion y cada decisión se guarda con PATCH .../estado.
export default function SolicitudesFundacionApi() {
  const { pathname } = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState({ status: 'loading', requests: [], photos: new Map() })
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState('abiertas')
  const [dialog, setDialog] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lastSelected, setLastSelected] = useState(null)
  const section = pathname.split('/')[2]
  const foundationId = user.backendFoundationId

  useEffect(() => {
    if (foundationId == null) return undefined
    let active = true
    Promise.all([listarSolicitudesDeFundacion(foundationId), listarArchivos().catch(() => [])])
      .then(([requests, archivos]) => {
        if (!active) return
        const sorted = (Array.isArray(requests) ? requests : []).sort((a, b) => (apiDate(b.fechaCreacion) ?? 0) - (apiDate(a.fechaCreacion) ?? 0))
        setData({ status: 'success', requests: sorted, photos: fotosPorMascota(archivos) })
      })
      .catch(() => {
        if (active) setData((prev) => ({ ...prev, status: 'error' }))
      })
    return () => {
      active = false
    }
  }, [foundationId, attempt])

  // Esta cuenta solo tiene la sección de solicitudes.
  if (section !== 'solicitudes') return <Navigate to="/fundacion/solicitudes" replace />

  const selected = id ? data.requests.find((request) => String(request.id) === id) : null
  // El filtro sigue a la solicitud abierta: al abrirla o cambiarle el estado se muestra su pestaña.
  const selectedKey = selected ? `${selected.id}-${selected.estado}` : null
  if (selectedKey !== lastSelected) {
    setLastSelected(selectedKey)
    const tab = selected && filters.find((item) => item.states.includes(selected.estado))
    if (tab && tab.value !== filter) setFilter(tab.value)
  }
  const current = filters.find((item) => item.value === filter)
  const visible = data.requests.filter((request) => current.states.includes(request.estado))

  async function decide(request, estado, mensaje, success) {
    setSaving(true)
    try {
      const updated = await cambiarEstadoSolicitud(request.id, { usuarioId: user.backendId, estado, mensaje })
      // Aprobar cierra las demás solicitudes de la mascota en el backend: se recarga la lista completa.
      if (estado === 'APROBADA') setAttempt((value) => value + 1)
      else setData((prev) => ({ ...prev, requests: prev.requests.map((item) => (item.id === updated.id ? updated : item)) }))
      showToast(success, { tone: 'success' })
    } catch (error) {
      showToast(error.message, { tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const dialogs = selected && {
    documentos: {
      title: 'Pedir más documentos',
      text: `${applicantName(selected)} verá tu mensaje en su solicitud y podrá responderte desde ahí.`,
      icon: 'file',
      reasonLabel: '¿Qué documentos o información necesitas?',
      reasonPlaceholder: 'Ej.: copia de la cédula y un recibo de servicios públicos de la vivienda.',
      confirmLabel: 'Enviar pedido',
      onConfirm: ({ reason }) => decide(selected, 'DOCUMENTOS_PENDIENTES', reason, 'Le pedimos los documentos a la persona.'),
    },
    aprobar: {
      title: `¿Aprobar la adopción de ${selected.mascotaNombre}?`,
      text: `${selected.mascotaNombre} saldrá del listado de adopción y se cerrarán las demás solicitudes abiertas para ${selected.mascotaNombre}. Luego contacta a ${applicantName(selected)} para coordinar la entrega.`,
      icon: 'heart',
      confirmLabel: 'Aprobar adopción',
      onConfirm: () => decide(selected, 'APROBADA', null, `¡Adopción de ${selected.mascotaNombre} aprobada!`),
    },
    rechazar: {
      title: 'No aprobar esta solicitud',
      text: `${applicantName(selected)} verá el motivo en su solicitud.`,
      icon: 'alert-circle',
      tone: 'danger',
      reasonLabel: 'Motivo',
      reasonPlaceholder: 'Explica con respeto por qué no continúa el proceso.',
      confirmLabel: 'No aprobar',
      onConfirm: ({ reason }) => decide(selected, 'RECHAZADA', reason, 'La solicitud quedó como no aprobada.'),
    },
  }

  return (
    <main className={panelStyles.page}>
      <title>Solicitudes de adopción | PetMind</title>
      <header className={panelStyles.heading}>
        <div>
          <span className="eyebrow">{user.foundationName || 'Tu fundación'}</span>
          <h1>Solicitudes de adopción</h1>
          <p>Revisa quién quiere adoptar a tus mascotas: aprueba, pide más documentos o explica por qué no continúa.</p>
        </div>
      </header>

      {foundationId == null && (
        <div className="alert alert-warning" role="alert">
          <Icon name="alert-triangle" /> Tu cuenta no está vinculada a una fundación en el servidor.
        </div>
      )}
      {data.status === 'loading' && foundationId != null && <p role="status">Cargando solicitudes…</p>}
      {data.status === 'error' && (
        <div className="alert alert-error" role="alert">
          <Icon name="alert-circle" /> No pudimos cargar las solicitudes.
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {data.status === 'success' && (
        <div className={`${styles.layout} ${selected ? styles.withSelection : ''}`}>
          <section className={`panel ${styles.listCard}`}>
            <Tabs
              className={styles.filters}
              label="Filtrar solicitudes"
              variant="pills"
              value={filter}
              onChange={setFilter}
              tabs={filters.map((item) => ({ value: item.value, label: item.label, count: data.requests.filter((request) => item.states.includes(request.estado)).length }))}
            />
            <ul className={styles.list}>
              {visible.map((request) => {
                const status = statusOf(request.estado)
                const photo = data.photos.get(String(request.mascotaId))
                return (
                  <li key={request.id}>
                    <Link className={`${styles.row} ${String(request.id) === id ? styles.rowActive : ''}`} to={`/fundacion/solicitudes/${request.id}`}>
                      {photo ? <img src={photo} alt="" /> : <span className={styles.noPhoto}><Icon name="paw" /></span>}
                      <span className={styles.rowText}>
                        <strong>{applicantName(request)}</strong>
                        <small>
                          Quiere adoptar a {request.mascotaNombre} · {formatApiDate(request.fechaSolicitud)}
                        </small>
                      </span>
                      <StatusPill tone={status.tone} size="sm">
                        {status.label}
                      </StatusPill>
                    </Link>
                  </li>
                )
              })}
            </ul>
            {!visible.length && (
              <p className={styles.empty}>
                {data.requests.length ? 'No hay solicitudes con este filtro.' : 'Todavía no han llegado solicitudes para tus mascotas.'}
              </p>
            )}
          </section>

          <section className={`panel ${styles.detail}`} aria-live="polite">
            {!selected ? (
              <div className={styles.placeholder}>
                <span className="icon-tile icon-tile-neutral">
                  <Icon name="file" />
                </span>
                <p>{id ? 'No encontramos esta solicitud.' : 'Elige una solicitud para ver los datos de la persona y decidir.'}</p>
              </div>
            ) : (
              <RequestDetail
                request={selected}
                saving={saving}
                onReview={() => decide(selected, 'EN_REVISION', null, 'La solicitud pasó a revisión.')}
                onOpenDialog={setDialog}
                onClose={() => navigate('/fundacion/solicitudes')}
              />
            )}
          </section>
        </div>
      )}

      <ConfirmDialog open={Boolean(dialog && dialogs)} onClose={() => setDialog(null)} {...(dialog && dialogs ? dialogs[dialog] : {})} />
    </main>
  )
}

function RequestDetail({ request, saving, onReview, onOpenDialog, onClose }) {
  const status = statusOf(request.estado)
  const contact = request.solicitante ?? {}
  const open = isOpen(request)
  return (
    <>
      <header className={styles.detailHeader}>
        <div>
          <span className="eyebrow">Solicitud #{request.id} · {formatApiDate(request.fechaSolicitud)}</span>
          <h2>
            {applicantName(request)} <small>quiere adoptar a {request.mascotaNombre}</small>
          </h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar detalle">
          <Icon name="x" />
        </button>
      </header>

      <div className={styles.statusRow}>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
        <span>{status.text}</span>
      </div>

      <ul className={styles.contact}>
        {contact.correo && (
          <li>
            <Icon name="mail" /> <a href={`mailto:${contact.correo}`}>{contact.correo}</a>
          </li>
        )}
        {contact.telefono && (
          <li>
            <Icon name="phone" /> <a href={`tel:${contact.telefono}`}>{formatPhone(contact.telefono)}</a>
          </li>
        )}
        {contact.ciudad && (
          <li>
            <Icon name="map-pin" /> {contact.ciudad}
          </li>
        )}
      </ul>

      {request.mensajeFundacion && (
        <div className={`alert ${request.estado === 'RECHAZADA' ? 'alert-error' : 'alert-info'} ${styles.message}`}>
          <Icon name="message" />
          <div>
            <strong>{request.estado === 'DOCUMENTOS_PENDIENTES' ? 'Le pediste' : 'Tu mensaje'}</strong>
            <p>{request.mensajeFundacion}</p>
          </div>
        </div>
      )}
      {request.respuestaAdoptante && (
        <div className={`alert alert-success ${styles.message}`}>
          <Icon name="file" />
          <div>
            <strong>Respuesta de la persona</strong>
            <p>{request.respuestaAdoptante}</p>
          </div>
        </div>
      )}

      <h3 className={styles.subtitle}>Su hogar y su motivación</h3>
      <dl className={styles.answers}>
        {homeRows(request.datosHogar).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {open ? (
        <div className={styles.actions}>
          {['PENDIENTE', 'ENVIADA'].includes(request.estado) && (
            <button type="button" className="btn btn-secondary" onClick={onReview} disabled={saving}>
              <Icon name="clock" /> Pasar a revisión
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => onOpenDialog('documentos')} disabled={saving}>
            <Icon name="file" /> Pedir documentos
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onOpenDialog('rechazar')} disabled={saving}>
            No aprobar
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onOpenDialog('aprobar')} disabled={saving}>
            <Icon name="heart" /> Aprobar adopción
          </button>
        </div>
      ) : (
        <p className={styles.closed}>
          <Icon name="check" /> Decisión tomada el {formatApiDate(request.fechaDecision)}.
        </p>
      )}
    </>
  )
}
