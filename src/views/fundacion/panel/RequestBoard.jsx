import Avatar from '../../../components/ui/Avatar'
import { StatusPill } from '../../../components/ui/Badges'
import { SelectInput } from '../../../components/forms/Field'
import { boardStages } from '../../../data/adoptions'
import { formatWeekdayDate, timeAgo } from '../../../utils/dates'
import styles from '../Fundacion.module.css'

// Tarjeta arrastrable de una solicitud en el tablero (también se mueve con el menú «Mover a»).
export function RequestCard({ item, pet, selected, onSelect, onMove }) {
  return (
    <article
      className={`${styles.requestCard} ${selected ? styles.activeRequest : ''}`}
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
    >
      <button className={styles.requestOpen} type="button" onClick={onSelect}>
        <span className={styles.applicantLine}>
          <Avatar
            name={item.applicant?.name}
            initials={item.applicant?.initials}
            color={item.applicant?.color}
            size="sm"
          />
          <strong>{item.applicant?.name}</strong>
        </span>
        <small>
          {item.interview?.date
            ? `📅 ${formatWeekdayDate(item.interview.date)}`
            : timeAgo(item.updatedAt || item.createdAt)}
        </small>
        <span className={styles.petChip}>
          {pet?.photo && <img src={pet.photo} alt="" />}
          {pet?.name || item.petId}
        </span>
        <small>{item.applicant?.neighborhood || item.applicant?.city || 'Ubicación sin datos'}</small>
      </button>
      <StatusPill tone={item.compatibility >= 80 ? 'success' : item.compatibility >= 60 ? 'warning' : 'danger'}>
        {item.compatibility ?? '—'}% afín
      </StatusPill>
      <SelectInput
        aria-label={`Mover solicitud de ${item.applicant?.name}`}
        value={item.stage}
        onChange={(event) => onMove(event.target.value)}
      >
        <option value={item.stage}>Mover a…</option>
        {boardStages
          .filter((stage) => stage.value !== item.stage)
          .map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
      </SelectInput>
    </article>
  )
}

// Vista de tabla del tablero de solicitudes.
export function RequestsTable({ requests, pets, onMove, onSelect }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Persona</th>
            <th>Mascota</th>
            <th>Recibida</th>
            <th>Compatibilidad</th>
            <th>Etapa</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((item) => (
            <tr key={item.id}>
              <td>{item.applicant?.name}</td>
              <td>{pets.find((pet) => pet.id === item.petId)?.name || item.petId}</td>
              <td>{timeAgo(item.createdAt)}</td>
              <td>{item.compatibility ?? '—'}%</td>
              <td>
                <SelectInput
                  aria-label={`Etapa de ${item.id}`}
                  value={item.stage}
                  onChange={(event) => onMove(item, event.target.value)}
                >
                  {boardStages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </SelectInput>
              </td>
              <td>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => onSelect(item)}>
                  Abrir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
