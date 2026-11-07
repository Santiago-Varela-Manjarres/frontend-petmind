import { useState } from 'react'
import { FileDropzone } from '../../../components/forms/FileDropzone'
import { StatusPill } from '../../../components/ui/Badges'
import Icon from '../../../components/ui/Icon'
import { registrationDocuments } from '../../../data/foundations'
import styles from '../Fundacion.module.css'

// Las fundaciones de prueba se verificaron antes de existir el registro: traen estos tres documentos.
const verifiedDocs = [
  { name: 'RUT de la fundación', status: 'Verificado' },
  { name: 'Cámara de comercio', status: 'Verificado' },
  { name: 'Informe de gestión', status: 'Verificado' },
]

// Documentos legales de la fundación y soportes pendientes de revisión.
// Los del registro (RUT y Cámara de comercio) quedan "Pendiente de revisión" hasta que el equipo PetMind
// verifica la fundación desde el panel de administración.
export default function DocumentsPanel({ user, foundation, updateUser, showToast }) {
  const registration = (foundation?.documents ?? []).filter(Boolean)
  const [docs, setDocs] = useState(user.documents || (registration.length ? [] : verifiedDocs))
  function persist(next) {
    setDocs(next)
    updateUser({ documents: next })
  }
  return (
    <section className={styles.card}>
      <h2>Documentos de la fundación</h2>
      <p className={styles.hint}>Consulta los documentos verificados o agrega soportes para revisión.</p>
      <FileDropzone
        accept=".pdf,image/*"
        title="Subir documento"
        onFiles={(files) => {
          persist([...docs, ...files.map((file) => ({ name: file.name, status: 'Pendiente de revisión' }))])
          showToast('Documento agregado. Queda pendiente de revisión.')
        }}
      />
      {registration.map((file, index) => (
        <div className={styles.teamRow} key={`registro-${index}`}>
          <Icon name={foundation.verified ? 'file-check' : 'clock'} />
          <span>
            <strong>{registrationDocuments[index] ?? 'Documento del registro'}</strong>
            <small>
              {file.name} · {foundation.verified ? 'Verificado' : 'Pendiente de revisión'}
            </small>
          </span>
          {foundation.verified && <StatusPill tone="success">Verificado</StatusPill>}
        </div>
      ))}
      {docs.map((doc, index) => (
        <div className={styles.teamRow} key={`${doc.name}-${index}`}>
          <Icon name={doc.status === 'Verificado' ? 'file-check' : 'clock'} />
          <span>
            <strong>{doc.name}</strong>
            <small>{doc.status}</small>
          </span>
          {doc.status === 'Verificado' && <StatusPill tone="success">Verificado</StatusPill>}
        </div>
      ))}
    </section>
  )
}
