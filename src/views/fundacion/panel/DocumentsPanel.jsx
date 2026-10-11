import { useState } from 'react'
import { FileDropzone } from '../../../components/forms/FileDropzone'
import { StatusPill } from '../../../components/ui/Badges'
import Icon from '../../../components/ui/Icon'
import styles from '../Fundacion.module.css'

// Documentos legales de la fundación y soportes pendientes de revisión.
export default function DocumentsPanel({ user, updateUser, showToast }) {
  const [docs, setDocs] = useState(
    user.documents || [
      { name: 'RUT de la fundación', status: 'Verificado' },
      { name: 'Cámara de comercio', status: 'Verificado' },
      { name: 'Informe de gestión', status: 'Verificado' },
    ],
  )
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
