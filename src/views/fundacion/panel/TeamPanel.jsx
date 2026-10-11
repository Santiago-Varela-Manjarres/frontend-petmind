import { useState } from 'react'
import Avatar from '../../../components/ui/Avatar'
import styles from '../Fundacion.module.css'

// Personas con acceso al panel. La invitación es local: la demo no envía correos.
export default function TeamPanel({ team, persist, showToast }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  return (
    <section className={styles.card}>
      <h2>Personas con acceso</h2>
      {team.map((member, index) => (
        <div className={styles.teamRow} key={`${member.email}-${index}`}>
          <Avatar name={member.name} size="sm" />
          <span>
            <strong>{member.name}</strong>
            <small>
              {member.email} · {member.role}
            </small>
          </span>
          {member.role !== 'Representante legal' && (
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => persist(team.filter((_, item) => item !== index))}
            >
              Quitar
            </button>
          )}
        </div>
      ))}
      <form
        className={styles.inlineForm}
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim() || !email.trim()) return
          persist([...team, { name: name.trim(), email: email.trim(), role: 'Voluntario' }])
          setName('')
          setEmail('')
          showToast('Agregamos a la persona al equipo.')
        }}
      >
        <input
          className="input"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre de la persona"
        />
        <input
          className="input"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Correo electrónico"
        />
        <button className="btn btn-primary">Agregar miembro</button>
      </form>
      <p className={styles.hint}>La invitación queda registrada localmente en esta demo; no enviamos correos.</p>
    </section>
  )
}
