import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import CampaignCard from '../../components/cards/CampaignCard'
import PetCard from '../../components/cards/PetCard'
import Icon from '../../components/ui/Icon'
import { useAdoptions } from '../../context/AdoptionsContext'
import { useAuth } from '../../context/AuthContext'
import { useCampaigns } from '../../context/CampaignsContext'
import { useDonations } from '../../context/DonationsContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { useReports } from '../../context/ReportsContext'
import { useToast } from '../../context/ToastContext'
import { useLogout } from '../../hooks/useLogout'
import { isValidPassword, PASSWORD_ERROR } from '../../utils/password'
import { PasswordStrength } from '../../components/forms/PasswordInput'
import { stageLabels, finishedStages } from '../../data/adoptions'
import { reportStatusLabels } from '../../data/reports'
import { formatCOP, formatCOPShort, downloadTextFile, isValidEmail } from '../../utils/format'
import styles from './Cuenta.module.css'

const headings = {
  resumen: 'Mi cuenta',
  solicitudes: 'Mis solicitudes',
  favoritos: 'Favoritos',
  donaciones: 'Mis donaciones',
  reportes: 'Mis reportes',
  mensajes: 'Mensajes',
  perfil: 'Mi perfil',
}
const fieldLabel = {
  name: 'Nombre',
  lastName: 'Apellidos',
  email: 'Correo electrónico',
  phone: 'Celular',
  city: 'Ciudad',
  housing: 'Vivienda',
}

export default function PanelCuenta() {
  const { pathname } = useLocation()
  const section = pathname.split('/')[2] || 'resumen'
  const { user, users, updateUser, changePassword, deleteAccount } = useAuth()
  const handleLogout = useLogout()
  const { requests, moveRequest, deleteRequest } = useAdoptions()
  const { favorites } = useFavorites()
  const { foundations } = useFoundations()
  const { pets } = usePets()
  const { campaigns } = useCampaigns()
  const { donations, updateDonation } = useDonations()
  const { reports } = useReports()
  const { showToast } = useToast()
  const mine = requests.filter((item) => item.userId === user.id)
  const active = mine.filter((item) => !finishedStages.includes(item.stage) && item.stage !== 'borrador')
  const myDonations = donations.filter((item) => item.userId === user.id)
  const myReports = reports.filter((item) => item.userId === user.id)
  const [filter, setFilter] = useState('Todas')
  const [tab, setTab] = useState('Mascotas')
  const [profile, setProfile] = useState({
    name: user.name || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    city: user.city || '',
    housing: user.housing || '',
  })
  const [security, setSecurity] = useState({ current: '', next: '', confirm: '' })
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordError, setPasswordError] = useState('')
  const favoritePets = pets.filter((item) => favorites.pets.includes(item.id))
  const favoriteCampaigns = campaigns.filter((item) => favorites.campaigns.includes(item.id))
  const favoriteFoundations = foundations.filter((item) => favorites.foundations.includes(item.id))
  const totalDonated = myDonations
    .filter((item) => item.status === 'aprobada')
    .reduce((sum, item) => sum + item.amount, 0)
  const filteredRequests = mine.filter(
    (item) =>
      filter === 'Todas' ||
      (filter === 'Borradores' && item.stage === 'borrador') ||
      (filter === 'Finalizadas' && finishedStages.includes(item.stage)) ||
      (filter === 'En curso' && !finishedStages.includes(item.stage) && item.stage !== 'borrador'),
  )
  const conversations = mine.filter((item) => item.messages?.length)
  const unreadMessages = mine.flatMap((item) =>
    (item.messages || [])
      .filter((message) => message.from === 'foundation' && !message.read)
      .map((message) => ({ ...message, request: item })),
  )

  function saveProfile(event) {
    event.preventDefault()
    const errors = {}
    if (!profile.name.trim()) errors.name = 'Escribe tu nombre.'
    if (!profile.lastName.trim()) errors.lastName = 'Escribe tus apellidos.'
    const email = profile.email.trim()
    if (!isValidEmail(email)) errors.email = 'Escribe un correo válido.'
    // El correo identifica la cuenta al iniciar sesión: no puede repetirse con el de otra persona.
    else if (users.some((item) => item.id !== user.id && item.email.toLowerCase() === email.toLowerCase()))
      errors.email = 'Ya existe otra cuenta con este correo.'
    if (profile.phone.replace(/\D/g, '').length < 7) errors.phone = 'Escribe un celular válido.'
    setProfileErrors(errors)
    if (Object.keys(errors).length) return
    updateUser({ ...profile, email })
    showToast('Guardamos los cambios de tu perfil.', { tone: 'success' })
  }

  function updatePassword(event) {
    event.preventDefault()
    if (!isValidPassword(security.next)) return setPasswordError(PASSWORD_ERROR)
    if (security.next !== security.confirm) return setPasswordError('Las contraseñas nuevas no coinciden.')
    const result = changePassword(security.current, security.next)
    setPasswordError(result.error || '')
    if (result.ok) {
      setSecurity({ current: '', next: '', confirm: '' })
      showToast('Actualizamos tu contraseña.', { tone: 'success' })
    }
  }

  function downloadReceipt(donation) {
    downloadTextFile(
      `certificado-${donation.id}.txt`,
      `Certificado de donación PetMind\nReferencia: ${donation.id}\nFecha: ${new Date(donation.date).toLocaleDateString('es-CO')}\nAporte: ${formatCOP(donation.amount)}\nDonante: ${donation.anonymous ? 'Anónimo' : donation.donorName || user.name}\nEste documento es un comprobante demostrativo.`,
    )
  }

  return (
    <div className={styles.page}>
      <title>{`${headings[section] || 'Mi cuenta'} | PetMind`}</title>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow">Hola, {user.name}</span>
          <h1>{headings[section] || headings.resumen}</h1>
          <p>Tu espacio para acompañar cada historia.</p>
        </div>
        {section === 'resumen' && (
          <Link className="btn btn-primary" to="/adoptar">
            <Icon name="search" />
            Encontrar mascota
          </Link>
        )}
      </header>
      {section === 'resumen' && (
        <>
          <div className={styles.stats}>
            <article>
              <Icon name="file" />
              <strong>{active.length}</strong>
              <span>Solicitudes activas</span>
            </article>
            <article>
              <Icon name="heart" />
              <strong>{favorites.pets.length + favorites.campaigns.length}</strong>
              <span>Favoritos guardados</span>
            </article>
            <article>
              <Icon name="star" />
              <strong>{formatCOPShort(totalDonated)}</strong>
              <span>Aportes realizados</span>
            </article>
            <article>
              <Icon name="zap" />
              <strong>{myReports.length}</strong>
              <span>Reportes enviados</span>
            </article>
          </div>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Tu proceso de adopción</h2>
              <Link to="/cuenta/solicitudes">
                Ver todas <Icon name="arrow-right" />
              </Link>
            </div>
            {active.length ? (
              active.slice(0, 2).map((item) => <RequestRow key={item.id} item={item} pets={pets} />)
            ) : (
              <Empty
                title="Aún no tienes solicitudes"
                text="Cuando envíes una solicitud de adopción, podrás seguirla aquí."
                action="Explorar mascotas"
                to="/adoptar"
              />
            )}
          </section>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Favoritos para ti</h2>
              <Link to="/cuenta/favoritos">
                Ver favoritos <Icon name="arrow-right" />
              </Link>
            </div>
            {favoritePets.length ? (
              <div className="card-grid">
                {favoritePets.slice(0, 3).map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <Empty
                title="Guarda tus favoritos"
                text="Marca mascotas y campañas con el corazón para encontrarlas fácilmente."
                action="Ver mascotas"
                to="/adoptar"
              />
            )}
          </section>
        </>
      )}
      {section === 'solicitudes' && (
        <section className={styles.section}>
          <div className={styles.toolbar}>
            <p>Consulta el estado y los mensajes de cada proceso.</p>
            <select
              className="select"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filtrar solicitudes"
            >
              <option>Todas</option>
              <option>En curso</option>
              <option>Finalizadas</option>
              <option>Borradores</option>
            </select>
          </div>
          {filteredRequests.map((item) => (
            <RequestRow
              key={item.id}
              item={item}
              pets={pets}
              onCancel={() => moveRequest(item.id, 'cancelada')}
              onDelete={() => deleteRequest(item.id)}
            />
          ))}
          {!mine.length && (
            <Empty
              title="Aún no has iniciado un proceso"
              text="Tu proceso aparecerá aquí cuando envíes una solicitud."
              action="Explorar mascotas"
              to="/adoptar"
            />
          )}
          {mine.length > 0 && !filteredRequests.length && (
            <Empty
              title="No hay solicitudes con este filtro"
              text="Prueba con otro filtro para ver el resto de tus procesos."
              action="Explorar mascotas"
              to="/adoptar"
            />
          )}
        </section>
      )}
      {section === 'favoritos' && (
        <section className={styles.section}>
          <div className={styles.tabs}>
            {['Mascotas', 'Campañas', 'Fundaciones'].map((item) => (
              <button
                type="button"
                key={item}
                className={tab === item ? styles.selectedTab : ''}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
          {tab === 'Mascotas' &&
            (favoritePets.length ? (
              <div className="card-grid">
                {favoritePets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <Empty
                title="Todavía no guardas mascotas"
                text="Explora mascotas y toca el corazón para guardarlas."
                action="Ver mascotas"
                to="/adoptar"
              />
            ))}
          {tab === 'Campañas' &&
            (favoriteCampaigns.length ? (
              <div className="card-grid">
                {favoriteCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <Empty
                title="Todavía no guardas campañas"
                text="Guarda una campaña para seguir sus avances."
                action="Ver campañas"
                to="/donar"
              />
            ))}
          {tab === 'Fundaciones' &&
            (favoriteFoundations.length ? (
              <div className={styles.foundationList}>
                {favoriteFoundations.map((foundation) => (
                  <Link className={styles.foundationRow} to={`/fundaciones/${foundation.id}`} key={foundation.id}>
                    <span className="icon-tile icon-tile-neutral">
                      <Icon name="home" />
                    </span>
                    <span>
                      <strong>{foundation.name}</strong>
                      <small>
                        {foundation.city}, {foundation.department}
                      </small>
                    </span>
                    <Icon name="arrow-right" />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty
                title="Explora fundaciones"
                text="Encuentra organizaciones verificadas y conoce su trabajo."
                action="Ver fundaciones"
                to="/fundaciones"
              />
            ))}
        </section>
      )}
      {section === 'donaciones' && (
        <section className={styles.section}>
          <div className={styles.stats}>
            <article>
              <strong>{formatCOP(totalDonated)}</strong>
              <span>Total aportado</span>
            </article>
            <article>
              <strong>{myDonations.filter((item) => item.status === 'aprobada').length}</strong>
              <span>Donaciones exitosas</span>
            </article>
            <article>
              <strong>{myDonations.filter((item) => item.subscription === 'activa').length}</strong>
              <span>Aportes mensuales</span>
            </article>
          </div>
          {myDonations.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Campaña</th>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Frecuencia</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {myDonations.map((donation) => (
                    <tr key={donation.id}>
                      <td>
                        {campaigns.find((item) => item.id === donation.campaignId)?.title || 'Fondo PetMind'}
                        <small>{donation.id}</small>
                      </td>
                      <td>{new Date(donation.date).toLocaleDateString('es-CO')}</td>
                      <td>{formatCOP(donation.amount)}</td>
                      <td>{donation.frequency === 'mensual' ? 'Mensual' : 'Única'}</td>
                      <td>
                        <span
                          className={`status-pill ${donation.status === 'aprobada' ? 'status-success' : 'status-danger'}`}
                        >
                          {donation.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={() => downloadReceipt(donation)}
                        >
                          Certificado
                        </button>
                        {donation.subscription && (
                          <button
                            className="btn btn-ghost btn-sm"
                            type="button"
                            onClick={() => {
                              updateDonation(donation.id, {
                                subscription: donation.subscription === 'activa' ? 'pausada' : 'activa',
                              })
                              showToast(
                                donation.subscription === 'activa'
                                  ? 'Pausamos el aporte mensual.'
                                  : 'Reactivamos el aporte mensual.',
                              )
                            }}
                          >
                            {donation.subscription === 'activa' ? 'Pausar' : 'Reactivar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Aún no has hecho una donación"
              text="Cuando apoyes una campaña, el registro aparecerá aquí."
              action="Ver campañas"
              to="/donar"
            />
          )}
        </section>
      )}
      {section === 'reportes' && (
        <section className={styles.section}>
          {myReports.length ? (
            myReports.map((report) => (
              <article className={styles.reportRow} key={report.id}>
                <div>
                  <strong>
                    {report.type} · {report.species}
                  </strong>
                  <span>
                    {report.id} · {report.address}
                  </span>
                  <small>{new Date(report.createdAt).toLocaleDateString('es-CO')}</small>
                </div>
                <span className="status-pill status-info">{reportStatusLabels[report.status] || report.status}</span>
              </article>
            ))
          ) : (
            <Empty
              title="No has enviado reportes"
              text="Si ves un animal que necesita ayuda, avísanos para notificar a fundaciones cercanas."
              action="Reportar un caso"
              to="/reportar"
            />
          )}
        </section>
      )}
      {section === 'mensajes' && (
        <section className={styles.section}>
          {conversations.length ? (
            conversations.map((item) => (
              <Link className={styles.messageRow} key={item.id} to={`/cuenta/solicitudes/${item.id}`}>
                <span className={styles.messageIcon}>
                  <Icon name="message" />
                </span>
                <div>
                  <strong>
                    {foundations.find((foundation) => foundation.id === item.foundationId)?.name || 'Fundación'} ·
                    Solicitud {item.id}
                  </strong>
                  <p>{item.messages.at(-1)?.text}</p>
                  <small>
                    {pets.find((pet) => pet.id === item.petId)?.name || 'Mascota'} ·{' '}
                    {unreadMessages.filter((message) => message.request.id === item.id).length
                      ? 'Mensaje nuevo'
                      : 'Ver conversación'}
                  </small>
                </div>
                <Icon name="chevron-right" />
              </Link>
            ))
          ) : (
            <Empty
              title="Tu bandeja está tranquila"
              text="Los mensajes de las fundaciones llegarán aquí."
              action="Ver mis solicitudes"
              to="/cuenta/solicitudes"
            />
          )}
        </section>
      )}
      {section === 'perfil' && (
        <div className={styles.profileGrid}>
          <section id="datos" className={styles.section}>
            <h2>Información personal</h2>
            <form onSubmit={saveProfile} noValidate>
              <div className="form-row">
                {['name', 'lastName'].map((key) => (
                  <label className="field" key={key}>
                    <span className="field-label">{fieldLabel[key]}</span>
                    <input
                      className="input"
                      value={profile[key]}
                      onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
                    />
                    {profileErrors[key] && <small className="field-error">{profileErrors[key]}</small>}
                  </label>
                ))}
              </div>
              {['email', 'phone', 'city', 'housing'].map((key) => (
                <label className="field" key={key}>
                  <span className="field-label">{fieldLabel[key]}</span>
                  <input
                    className="input"
                    value={profile[key]}
                    onChange={(event) => setProfile({ ...profile, [key]: event.target.value })}
                  />
                  {profileErrors[key] && <small className="field-error">{profileErrors[key]}</small>}
                </label>
              ))}
              <button className="btn btn-primary" type="submit">
                Guardar cambios
              </button>
            </form>
          </section>
          <div className={styles.stack}>
            <section id="notificaciones" className={styles.section}>
              <h2>Notificaciones</h2>
              {Object.entries({
                requests: 'Actualizaciones de solicitudes',
                campaigns: 'Campañas y donaciones',
                alerts: 'Alertas de animales',
                newsletter: 'Novedades PetMind',
              }).map(([key, label]) => (
                <label className={styles.switchRow} key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(user.notifications?.[key])}
                    onChange={(event) =>
                      updateUser({ notifications: { ...user.notifications, [key]: event.target.checked } })
                    }
                  />
                </label>
              ))}
            </section>
            <section id="seguridad" className={styles.section}>
              <h2>Seguridad</h2>
              <form onSubmit={updatePassword}>
                <label className="field">
                  <span className="field-label">Contraseña actual</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    className="input"
                    value={security.current}
                    onChange={(event) => setSecurity({ ...security, current: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Nueva contraseña</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="input"
                    value={security.next}
                    onChange={(event) => setSecurity({ ...security, next: event.target.value })}
                  />
                </label>
                {security.next && <PasswordStrength value={security.next} showRules />}
                <label className="field">
                  <span className="field-label">Repite la nueva contraseña</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="input"
                    value={security.confirm}
                    onChange={(event) => setSecurity({ ...security, confirm: event.target.value })}
                  />
                </label>
                {passwordError && (
                  <p className="field-error" role="alert">
                    {passwordError}
                  </p>
                )}
                <button className="btn btn-secondary" type="submit">
                  Actualizar contraseña
                </button>
              </form>
            </section>
            <section className={styles.section}>
              <h2>Cuenta</h2>
              <p>Tu sesión está protegida por PetMind.</p>
              <button className="btn btn-ghost" type="button" onClick={handleLogout}>
                Cerrar sesión
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => {
                  if (window.confirm('¿Quieres eliminar tu cuenta? Esta acción cerrará tu sesión.')) deleteAccount()
                }}
              >
                Eliminar cuenta
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

function RequestRow({ item, pets, onCancel, onDelete }) {
  const pet = pets.find((entry) => entry.id === item.petId)
  return (
    <article className={styles.requestRow}>
      <img src={pet?.photo} alt="" />
      <div className={styles.requestDetails}>
        <strong>
          {pet?.name || 'Mascota'} <small>· {item.id}</small>
        </strong>
        <span>{item.stage === 'borrador' ? 'Borrador guardado' : stageLabels[item.stage] || item.stage}</span>
        <small>Actualizada {new Date(item.updatedAt || item.createdAt).toLocaleDateString('es-CO')}</small>
      </div>
      <div className={styles.rowActions}>
        {item.stage === 'borrador' ? (
          <Link className="btn btn-primary btn-sm" to={`/adoptar/${item.petId}/solicitud`}>
            Continuar
          </Link>
        ) : (
          <Link className="btn btn-secondary btn-sm" to={`/cuenta/solicitudes/${item.id}`}>
            Ver proceso
          </Link>
        )}
        {onCancel && !finishedStages.includes(item.stage) && item.stage !== 'borrador' && (
          <button className="btn btn-ghost btn-sm" onClick={onCancel} type="button">
            Cancelar
          </button>
        )}
        {onDelete && item.stage === 'borrador' && (
          <button className="btn btn-ghost btn-sm" onClick={onDelete} type="button">
            Eliminar
          </button>
        )}
      </div>
    </article>
  )
}

function Empty({ title, text, action, to }) {
  return (
    <div className="empty-state">
      <span className="icon-tile icon-tile-neutral">
        <Icon name="paw" />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <Link className="btn btn-secondary btn-sm" to={to}>
        {action}
      </Link>
    </div>
  )
}
