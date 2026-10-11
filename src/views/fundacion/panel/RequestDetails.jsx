import { useState } from 'react'
import { Field } from '../../../components/forms/Field'
import Avatar from '../../../components/ui/Avatar'
import { StatusPill } from '../../../components/ui/Badges'
import Icon from '../../../components/ui/Icon'
import { useAdoptions } from '../../../context/AdoptionsContext'
import { boardStages, finishedStages, stageLabels } from '../../../data/adoptions'
import { formatAge, formatDate, formatDateTime, formatWeekdayDate, isFuture, toDateInput } from '../../../utils/dates'
import { downloadTextFile } from '../../../utils/format'
import styles from '../Fundacion.module.css'

// Detalle de una solicitud: datos del hogar, mensajes, notas internas, historial y decisiones.
// Se monta con key={item.id} para que la fecha de reprogramación y el formulario de rechazo
// no se mezclen entre solicitudes.
export default function RequestDetails({ item, pet, ownRequests, onMove, foundation, author, showToast, onClose }) {
  const { addMessage, addNote, updateRequest } = useAdoptions()
  const [chat, setChat] = useState('')
  const [note, setNote] = useState('')
  const answers = item.answers || {}
  const [interviewDate, setInterviewDate] = useState(item.interview?.date ? toDateInput(item.interview.date) : '')
  const [interviewTime, setInterviewTime] = useState(
    item.interview?.date ? new Date(item.interview.date).toTimeString().slice(0, 5) : '10:00',
  )
  const [rejectMessage, setRejectMessage] = useState('')
  const [showReject, setShowReject] = useState(false)
  const stageIndex = boardStages.findIndex((stage) => stage.value === item.stage)
  const nextStage = boardStages[stageIndex + 1]?.value
  const applicant = item.applicant || {}
  function sendChat(event) {
    event.preventDefault()
    if (!chat.trim()) return
    addMessage(item.id, { from: 'foundation', author, text: chat.trim() })
    setChat('')
  }

  function saveNote(event) {
    event.preventDefault()
    if (!note.trim()) return
    addNote(item.id, { text: note.trim(), author })
    setNote('')
    showToast('Guardamos la nota interna.')
  }

  function reschedule(event) {
    event.preventDefault()
    if (!interviewDate || !isFuture(new Date(`${interviewDate}T${interviewTime}`))) {
      showToast('Elige una fecha y hora futuras para la entrevista.', { tone: 'error' })
      return
    }
    const date = new Date(`${interviewDate}T${interviewTime}`).toISOString()
    const interview = {
      ...item.interview,
      date,
      with: item.interview?.with || foundation?.representative,
      mode: item.interview?.mode || 'Videollamada',
    }
    updateRequest(item.id, { interview })
    showToast('Reprogramamos la entrevista. La persona verá el cambio en su seguimiento.', { tone: 'success' })
  }
  function reject(event) {
    event.preventDefault()
    if (!rejectMessage.trim()) return
    onMove(item, 'no-seleccionada', {
      result: { message: rejectMessage.trim(), author: foundation?.name || 'La fundación' },
    })
  }
  const doc = `Solicitud ${item.id} · PetMind\n\n${applicant.name || 'Solicitante'} solicita adoptar a ${pet?.name || item.petId}.\nEtapa: ${stageLabels[item.stage] || item.stage}.\nCompatibilidad: ${item.compatibility ?? 'Sin puntaje'}%.\n\nMotivación:\n${answers.motivation || 'No registrada'}\n\nContacto: ${applicant.phone || answers.phone || 'Sin teléfono'} · ${applicant.email || answers.email || 'Sin correo'}\nGenerado el ${formatDateTime(new Date())}.`
  return (
    <section className={styles.details}>
      <div className={styles.sectionHead}>
        <div>
          <span className="eyebrow">
            Solicitudes › {pet?.name || item.petId} › #{item.id}
          </span>
          <h2>Solicitud de {applicant.name}</h2>
        </div>
        <div className={styles.toolbar}>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => document.getElementById('request-chat')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Enviar mensaje
          </button>
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => downloadTextFile(`${item.id}.txt`, doc)}
          >
            Descargar resumen
          </button>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Cerrar detalle">
            <Icon name="x" />
          </button>
        </div>
      </div>
      <div className={styles.detailLayout}>
        <div className={styles.detailMain}>
          <section className={styles.card}>
            <div className={styles.applicantHeader}>
              <Avatar name={applicant.name} initials={applicant.initials} color={applicant.color} size="xl" />
              <div>
                <h3>{applicant.name}</h3>
                <p>
                  {applicant.city || answers.city} ·{' '}
                  {applicant.neighborhood || answers.neighborhood || 'Barrio sin datos'}
                </p>
                <p>
                  {applicant.phone || answers.phone} · {applicant.email || answers.email}
                </p>
                <small>Enviada {formatDate(item.createdAt, { year: true })}</small>
              </div>
              <div className={styles.scoreRing} style={{ '--score': `${item.compatibility || 0}%` }}>
                <strong>{item.compatibility ?? '—'}%</strong>
                <small>compatible</small>
              </div>
            </div>
            <div className={styles.badgeRow}>
              {(applicant.badges || []).map((badge) => (
                <StatusPill key={badge} tone={badge === 'rented' ? 'warning' : 'success'}>
                  {badge === 'emailVerified'
                    ? 'Correo verificado'
                    : badge === 'experience'
                      ? 'Ha tenido mascotas'
                      : 'Vivienda arrendada'}
                </StatusPill>
              ))}
            </div>
          </section>
          <section className={styles.card}>
            <h3>Motivación</h3>
            <blockquote>{answers.motivation || 'La persona no agregó una motivación.'}</blockquote>
            <h3>Hogar</h3>
            <div className={styles.answerGrid}>
              {[
                ['Vivienda', `${answers.housingType || '—'} · ${answers.housingTenure || ''}`],
                ['Arrendador permite mascotas', answers.landlordAllows || '—'],
                ['Personas en casa', answers.people ?? '—'],
                ['Niños', answers.kids || '—'],
                ['Otras mascotas', answers.otherPets || '—'],
                ['Espacio', answers.space || 'Sin descripción'],
              ].map(([label, value]) => (
                <p key={label}>
                  <strong>{label}</strong>
                  <span>{String(value)}</span>
                </p>
              ))}
            </div>
            {answers.spacePhotos?.length > 0 && (
              <div className={styles.photoNote}>
                <Icon name="image" />
                <span>{answers.spacePhotos.map((file) => file.name).join(', ')}</span>
              </div>
            )}
            <h3>Experiencia y compromiso</h3>
            <div className={styles.answerGrid}>
              {[
                ['Experiencia previa', answers.experience],
                ['Horas sola al día', answers.hoursAlone],
                ['Presupuesto mensual', answers.budget],
                ['En viajes la cuida', answers.travelCare],
                [
                  'Compromisos aceptados',
                  answers.commitments
                    ? `${Object.values(answers.commitments).filter(Boolean).length} de ${Object.keys(answers.commitments).length}`
                    : '—',
                ],
                ['Seguimiento 6 meses', answers.commitments?.followUp ? 'Aceptado' : 'Pendiente'],
              ].map(([label, value]) => (
                <p key={label}>
                  <strong>{label}</strong>
                  <span>{String(value ?? '—')}</span>
                </p>
              ))}
            </div>
          </section>
          <section className={styles.card} id="request-chat">
            <h3>Mensajes con la persona</h3>
            <div className={styles.chatLog}>
              {(item.messages || []).map((message) => (
                <p className={message.from === 'foundation' ? styles.outgoing : ''} key={message.id}>
                  <strong>{message.author}:</strong> {message.text}
                  <small>{message.date && formatDateTime(message.date)}</small>
                </p>
              ))}
            </div>
            <form className={styles.inlineForm} onSubmit={sendChat}>
              <input
                className="input"
                placeholder="Escribe un mensaje al adoptante"
                value={chat}
                onChange={(event) => setChat(event.target.value)}
              />
              <button className="btn btn-primary" type="submit">
                Enviar
              </button>
            </form>
          </section>
        </div>
        <aside className={styles.detailAside}>
          <section className={styles.card}>
            <div className={styles.petCell}>
              <img src={pet?.photo} alt="" />
              <span>
                <strong>{pet?.name || item.petId}</strong>
                <small>
                  {pet ? `${formatAge(pet.ageMonths)} · ${pet.size} · ` : ''}
                  {ownRequests.filter((request) => request.petId === item.petId).length} solicitudes
                </small>
              </span>
            </div>
            <h3>Etapa actual</h3>
            <StatusPill tone="warning">
              {stageLabels[item.stage]}
              {item.interview?.date ? ` · ${formatWeekdayDate(item.interview.date)}` : ''}
            </StatusPill>
            {nextStage && (
              <button className="btn btn-primary btn-block" type="button" onClick={() => onMove(item, nextStage)}>
                Pasar a {stageLabels[nextStage]}
              </button>
            )}
            {item.stage === 'entrevista' && (
              <form className={styles.reschedule} onSubmit={reschedule}>
                <strong>Reprogramar entrevista</strong>
                <div className="form-row">
                  <input
                    className="input"
                    aria-label="Fecha de entrevista"
                    type="date"
                    value={interviewDate}
                    onChange={(event) => setInterviewDate(event.target.value)}
                  />
                  <input
                    className="input"
                    aria-label="Hora de entrevista"
                    type="time"
                    value={interviewTime}
                    onChange={(event) => setInterviewTime(event.target.value)}
                  />
                </div>
                <button className="btn btn-secondary btn-sm" type="submit">
                  Guardar nueva fecha
                </button>
              </form>
            )}
            {!finishedStages.includes(item.stage) && (
              <button
                className="btn btn-danger btn-block"
                type="button"
                onClick={() => setShowReject((value) => !value)}
              >
                No continuar
              </button>
            )}
            {showReject && (
              <form className={styles.rejectForm} onSubmit={reject}>
                <Field label="Mensaje para la persona" htmlFor="reject-message">
                  <textarea
                    id="reject-message"
                    required
                    className="textarea"
                    value={rejectMessage}
                    onChange={(event) => setRejectMessage(event.target.value)}
                    placeholder="Explícale la decisión con respeto"
                  />
                </Field>
                <button className="btn btn-danger btn-sm" type="submit">
                  Enviar decisión
                </button>
              </form>
            )}
          </section>
          <section className={styles.card}>
            <h3>Notas internas</h3>
            {(item.notes || []).map((entry) => (
              <div className={styles.note} key={entry.id}>
                <p>{entry.text}</p>
                <small>
                  {entry.author} · {formatDateTime(entry.date)}
                </small>
              </div>
            ))}
            <form className={styles.inlineForm} onSubmit={saveNote}>
              <input
                className="input"
                placeholder="Agregar una nota..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <button className="btn btn-secondary" type="submit">
                Guardar
              </button>
            </form>
          </section>
          <section className={styles.card}>
            <h3>Historial</h3>
            {(item.history || []).map((entry, index) => (
              <div className={styles.historyRow} key={`${entry.date}-${index}`}>
                <i />
                <span>
                  <strong>{entry.text}</strong>
                  <small>
                    {formatDateTime(entry.date)}
                    {entry.by ? ` · ${entry.by}` : ''}
                  </small>
                </span>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </section>
  )
}
