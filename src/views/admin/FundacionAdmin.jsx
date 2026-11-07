import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar'
import { StatusPill } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Icon from '../../components/ui/Icon'
import { useAdminLog } from '../../context/AdminLogContext'
import { useAdoptions } from '../../context/AdoptionsContext'
import { useAuth } from '../../context/AuthContext'
import { useCampaigns } from '../../context/CampaignsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { isCampaignLive } from '../../data/campaigns'
import { registrationDocuments, verificationOf, verificationStatuses } from '../../data/foundations'
import { isAdoptable } from '../../data/pets'
import { formatDate, formatDateTime } from '../../utils/dates'
import { formatCOPShort, formatPhone } from '../../utils/format'
import { isHidden } from '../../utils/moderation'
import NoEncontrada from '../NoEncontrada'
import { ActivityList, AdminHeader } from './AdminParts'
import { foundationDialog } from './dialogs'
import { useModeration } from './useModeration'
import styles from './Admin.module.css'

function fileSize(bytes) {
  if (!bytes) return ''
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1).replace('.', ',')} MB` : `${Math.round(bytes / 1000)} KB`
}

// Panel de administración · Detalle de una fundación: datos, documentos, actividad y la decisión.
export default function FundacionAdmin() {
  const { id } = useParams()
  const { users } = useAuth()
  const { getFoundationById } = useFoundations()
  const { pets } = usePets()
  const { campaigns } = useCampaigns()
  const { requests } = useAdoptions()
  const { entriesFor } = useAdminLog()
  const moderation = useModeration()
  const [dialog, setDialog] = useState(null)

  const foundation = getFoundationById(id)
  if (!foundation) {
    return <NoEncontrada title="No encontramos esta fundación" text="Puede que el enlace esté mal escrito." backTo="/admin/fundaciones" backLabel="Ver fundaciones" />
  }

  const status = verificationOf(foundation)
  const info = verificationStatuses[status]
  const account = users.find((item) => item.foundationId === foundation.id)
  const ownPets = pets.filter((pet) => pet.foundationId === foundation.id)
  const ownCampaigns = campaigns.filter((campaign) => campaign.foundationId === foundation.id)
  const hiddenItems = [...ownPets, ...ownCampaigns].filter(isHidden).length
  const raised = ownCampaigns.reduce((total, campaign) => total + (Number(campaign.raised) || 0), 0)
  const adoptionRequests = requests.filter((request) => request.foundationId === foundation.id && request.stage !== 'borrador').length
  const history = entriesFor('fundacion', foundation.id)
  const decision = foundation.verification

  // Documentos del registro (RUT y Cámara de comercio) y los que la fundación subió desde su panel.
  // Las fundaciones de prueba verificadas antes del panel solo tienen su ficha de transparencia.
  const registration = (foundation.documents ?? []).filter(Boolean)
  const uploaded = account?.documents ?? []
  const transparency = registration.length || uploaded.length ? [] : (foundation.transparency ?? [])

  const nit = foundation.nit ?? account?.nit
  const checklist = [
    { label: 'NIT registrado', done: Boolean(nit) },
    { label: 'RUT adjunto', done: Boolean(registration[0]) },
    { label: 'Cámara de comercio adjunta', done: Boolean(registration[1]) },
    { label: 'Representante legal identificado', done: Boolean(account?.representative) },
    { label: 'Correo de la cuenta verificado', done: Boolean(account?.emailVerified) },
  ]

  function decide(kind) {
    setDialog(foundationDialog(kind, foundation, status, moderation))
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/admin/fundaciones">
        <Icon name="arrow-left" /> Volver a fundaciones
      </Link>
      <AdminHeader eyebrow="Fundaciones" title={foundation.name} text={`${foundation.city}${foundation.department ? `, ${foundation.department}` : ''}`}>
        {status === 'verificada' && (
          <Link className="btn btn-secondary" to={`/fundaciones/${foundation.id}`}>
            <Icon name="eye" />
            Ver perfil público
          </Link>
        )}
      </AdminHeader>

      <div className={styles.detail}>
        <div className={styles.detailMain}>
          <section className={styles.card}>
            <div className={styles.identity}>
              <Avatar name={foundation.name} initials={foundation.initials} color={foundation.color} size="lg" />
              <div>
                <h2>{foundation.name}</h2>
                <StatusPill tone={info.tone} size="sm">
                  {info.label}
                </StatusPill>
              </div>
            </div>
            <dl className={styles.facts}>
              <div>
                <dt>NIT</dt>
                <dd>{nit ?? 'Sin registrar'}</dd>
              </div>
              <div>
                <dt>Representante legal</dt>
                <dd>{account?.representative ?? 'Sin registrar'}</dd>
              </div>
              <div>
                <dt>Correo de la cuenta</dt>
                <dd>{account?.email ?? foundation.contact?.email ?? '—'}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{account?.phone ? formatPhone(account.phone) : (foundation.contact?.phone ?? '—')}</dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{foundation.contact?.address || 'Sin registrar'}</dd>
              </div>
              <div>
                <dt>Atiende</dt>
                <dd>{foundation.animals?.length ? foundation.animals.join(', ') : '—'}</dd>
              </div>
              <div>
                <dt>Registro en PetMind</dt>
                <dd>{foundation.createdAt ? formatDateTime(foundation.createdAt) : `Fundación desde ${foundation.since}`}</dd>
              </div>
              <div>
                <dt>Cuenta</dt>
                <dd>{account ? (account.suspended ? 'Suspendida' : 'Activa') : 'Sin cuenta asociada'}</dd>
              </div>
            </dl>
            {foundation.about && <p className={styles.about}>{foundation.about}</p>}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2>Documentos</h2>
                <p>Lo que la fundación adjuntó al registrarse y desde su panel.</p>
              </div>
            </div>
            {registration.map((file, index) => (
              <div className={styles.docRow} key={`registro-${index}`}>
                <Icon name="file" />
                <span className={styles.docText}>
                  <strong>{registrationDocuments[index] ?? 'Documento'}</strong>
                  <small>
                    {file.name}
                    {file.size ? ` · ${fileSize(file.size)}` : ''}
                  </small>
                </span>
                <StatusPill tone={status === 'verificada' ? 'success' : 'warning'} size="sm">
                  {status === 'verificada' ? 'Verificado' : 'Por revisar'}
                </StatusPill>
              </div>
            ))}
            {uploaded.map((doc, index) => (
              <div className={styles.docRow} key={`panel-${index}`}>
                <Icon name={doc.status === 'Verificado' ? 'file-check' : 'clock'} />
                <span className={styles.docText}>
                  <strong>{doc.name}</strong>
                  <small>Subido desde el panel de la fundación</small>
                </span>
                <StatusPill tone={doc.status === 'Verificado' ? 'success' : 'warning'} size="sm">
                  {doc.status === 'Verificado' ? 'Verificado' : 'Por revisar'}
                </StatusPill>
              </div>
            ))}
            {transparency.map((item) => (
              <div className={styles.docRow} key={item.label}>
                <Icon name="file-check" />
                <span className={styles.docText}>
                  <strong>{item.label}</strong>
                  <small>Ficha de transparencia</small>
                </span>
                <StatusPill tone="success" size="sm">
                  {item.value}
                </StatusPill>
              </div>
            ))}
            {!registration.length && !uploaded.length && !transparency.length && (
              <p className={styles.mutedText}>La fundación no ha adjuntado documentos.</p>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>Actividad en PetMind</h2>
            </div>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <strong>{ownPets.filter(isAdoptable).length}</strong>
                <span>de {ownPets.length} mascotas en adopción</span>
              </div>
              <div className={styles.metric}>
                <strong>{ownCampaigns.filter(isCampaignLive).length}</strong>
                <span>de {ownCampaigns.length} campañas activas</span>
              </div>
              <div className={styles.metric}>
                <strong>{formatCOPShort(raised)}</strong>
                <span>recaudados en campañas</span>
              </div>
              <div className={styles.metric}>
                <strong>{adoptionRequests}</strong>
                <span>solicitudes de adopción</span>
              </div>
            </div>
            <div className={styles.reviewActions}>
              <Link className="btn btn-secondary btn-sm" to={`/admin/mascotas?fundacion=${foundation.id}`}>
                <Icon name="paw" /> Ver sus mascotas
              </Link>
              <Link className="btn btn-secondary btn-sm" to={`/admin/campanas?fundacion=${foundation.id}`}>
                <Icon name="heart" /> Ver sus campañas
              </Link>
              {hiddenItems > 0 && (
                <span className={styles.subtle}>
                  {hiddenItems === 1 ? '1 publicación retirada' : `${hiddenItems} publicaciones retiradas`}
                </span>
              )}
            </div>
          </section>
        </div>

        <aside className={styles.detailAside}>
          <section className={`${styles.card} ${styles.decision}`}>
            <div className={styles.cardHead}>
              <h2>Decisión</h2>
              <StatusPill tone={info.tone} size="sm">
                {info.short}
              </StatusPill>
            </div>

            {status === 'pendiente' && (
              <>
                <p className={styles.mutedText}>
                  Revisa que los datos coincidan con los documentos antes de decidir. La fundación verá el resultado en su panel.
                </p>
                <ul className={styles.checklist}>
                  {checklist.map((item) => (
                    <li key={item.label} className={item.done ? '' : styles.missing}>
                      <Icon name={item.done ? 'check-circle' : 'alert-circle'} />
                      {item.label}
                      {!item.done && ' · falta'}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {decision?.reason && (status === 'rechazada' || status === 'suspendida') && (
              <div className={`${styles.notice} ${styles.noticeDanger}`}>
                <strong>{status === 'rechazada' ? 'Motivo del rechazo' : 'Motivo de la suspensión'}</strong>
                <span>{decision.reason}</span>
                <small>
                  {decision.by ?? 'Equipo PetMind'} · {formatDate(decision.date, { year: true })}
                </small>
              </div>
            )}

            {status === 'verificada' && (
              <div className={styles.notice}>
                <span>Aparece en el directorio con la insignia azul y recibe reportes de animales cercanos.</span>
                {decision?.date && (
                  <small>
                    Verificada por {decision.by ?? 'Equipo PetMind'} el {formatDate(decision.date, { year: true })}
                  </small>
                )}
              </div>
            )}

            {status !== 'verificada' && (
              <button type="button" className="btn btn-primary" onClick={() => decide('verificar')}>
                <Icon name="shield-check" />
                {status === 'suspendida' ? 'Reactivar fundación' : status === 'rechazada' ? 'Verificar de todas formas' : 'Verificar fundación'}
              </button>
            )}
            {status === 'pendiente' && (
              <button type="button" className="btn btn-danger" onClick={() => decide('rechazar')}>
                <Icon name="x" />
                Rechazar verificación
              </button>
            )}
            {status === 'verificada' && (
              <button type="button" className="btn btn-danger" onClick={() => decide('suspender')}>
                <Icon name="alert-triangle" />
                Suspender fundación
              </button>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2>Historial</h2>
            </div>
            <ActivityList entries={history} showTarget={false} emptyText="Todavía no hay decisiones sobre esta fundación." />
          </section>
        </aside>
      </div>

      <ConfirmDialog {...dialog} open={Boolean(dialog)} onClose={() => setDialog(null)} />
    </div>
  )
}
