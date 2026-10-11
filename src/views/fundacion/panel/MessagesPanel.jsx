import { Link } from 'react-router-dom'
import Avatar from '../../../components/ui/Avatar'
import Icon from '../../../components/ui/Icon'
import { formatDateTime } from '../../../utils/dates'
import Empty from './Empty'
import styles from '../Fundacion.module.css'

// Conversaciones con adoptantes: una fila por solicitud con su último mensaje.
export default function MessagesPanel({ ownRequests, ownPets }) {
  return (
    <section className={styles.card}>
      {ownRequests
        .filter((item) => item.messages?.length)
        .map((item) => {
          const last = item.messages.at(-1)
          return (
            <Link className={styles.messageRow} key={item.id} to={`/fundacion/solicitudes/${item.id}`}>
              <Avatar name={item.applicant?.name} initials={item.applicant?.initials} color={item.applicant?.color} />
              <span>
                <strong>
                  {item.applicant?.name} · {ownPets.find((pet) => pet.id === item.petId)?.name || item.petId}
                </strong>
                <small>
                  {last.author}: {last.text}
                </small>
                <small>{formatDateTime(last.date)}</small>
              </span>
              <Icon name="chevron-right" />
            </Link>
          )
        })}
      {!ownRequests.some((item) => item.messages?.length) && (
        <Empty text="Tus conversaciones con adoptantes aparecerán aquí." />
      )}
    </section>
  )
}
