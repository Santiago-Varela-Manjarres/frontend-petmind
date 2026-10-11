import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Field, IconInput } from '../../components/forms/Field'
import { FileChip, FileDropzone } from '../../components/forms/FileDropzone'
import Icon from '../../components/ui/Icon'
import { AccordionItem, Breadcrumbs } from '../../components/ui/Navigation'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { contactChannels, contactTopics, faqs } from '../../data/institutional'
import { isValidEmail } from '../../utils/format'
import styles from './Institucional.module.css'

export default function Contacto() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [topic, setTopic] = useState(params.get('tema') || 'Adopciones')
  const [subject, setSubject] = useState(params.get('asunto') || '')
  const [form, setForm] = useState({
    name: user ? [user.name, user.lastName].filter(Boolean).join(' ') : '',
    email: user?.email ?? '',
    message: '',
    files: [],
  })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  function submit(event) {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Escribe tu nombre.'
    if (!isValidEmail(form.email)) next.email = 'Escribe un correo válido.'
    if (!subject.trim()) next.subject = 'Escribe el asunto de tu mensaje.'
    if (form.message.trim().length < 10) next.message = 'Cuéntanos un poco más (mínimo 10 caracteres).'
    setErrors(next)
    if (Object.keys(next).length) return
    setSent(true)
    showToast('Recibimos tu mensaje. Te responderemos pronto.', { tone: 'success' })
    setForm((current) => ({ ...current, message: '', files: [] }))
    setSubject('')
  }

  return (
    <main className={styles.institutionalPage}>
      <title>Contacto | PetMind</title>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Contacto' }]} />
        <header className={styles.contactHeading}>
          <h1>
            ¿En qué te <span>podemos ayudar?</span>
          </h1>
          <p>Escríbenos y te respondemos en menos de 24 horas hábiles.</p>
        </header>
        <div className={styles.contactGrid}>
          <form className={`panel ${styles.contactForm}`} onSubmit={submit} noValidate>
            <h2>Envíanos un mensaje</h2>
            <fieldset>
              <legend>¿Sobre qué nos escribes?</legend>
              <div className={styles.topicList}>
                {contactTopics.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip-option ${topic === item ? 'active' : ''}`}
                    aria-pressed={topic === item}
                    onClick={() => setTopic(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
            {sent && (
              <div className="alert alert-success" role="status">
                <Icon name="check-circle" />
                ¡Gracias! Recibimos tu mensaje y te responderemos en menos de 24 horas hábiles.
              </div>
            )}
            <div className="form-row">
              <Field label="Nombre" htmlFor="contact-name" error={errors.name}>
                <input
                  id="contact-name"
                  className="input"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="Correo electrónico" htmlFor="contact-email" error={errors.email}>
                <IconInput
                  id="contact-email"
                  icon="mail"
                  type="email"
                  className={styles.withIcon}
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
            </div>
            <Field label="Asunto" htmlFor="contact-subject" error={errors.subject}>
              <input
                id="contact-subject"
                className="input"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                aria-invalid={Boolean(errors.subject)}
              />
            </Field>
            <Field label="Mensaje" htmlFor="contact-message" error={errors.message}>
              <textarea
                id="contact-message"
                className="textarea"
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                aria-invalid={Boolean(errors.message)}
              />
            </Field>
            <Field label="Adjuntar archivo" optional="(opcional)" htmlFor="contact-files">
              <FileDropzone
                accept="image/*,.pdf"
                layout="row"
                title="Arrastra una imagen o PDF"
                hint="Máximo 5 MB"
                onFiles={(files) => update('files', [...form.files, ...files])}
              />
              <span id="contact-files" className="sr-only">
                Adjuntar archivo
              </span>
              {form.files.map((file, index) => (
                <FileChip
                  key={`${file.name}-${index}`}
                  name={file.name}
                  onRemove={() =>
                    update(
                      'files',
                      form.files.filter((_, item) => item !== index),
                    )
                  }
                />
              ))}
            </Field>
            <button className="btn btn-primary btn-block" type="submit">
              <Icon name="send" />
              Enviar mensaje
            </button>
          </form>
          <aside className={styles.contactAside}>
            {contactChannels.map((channel) => (
              <article className={`panel panel-sm ${styles.channel}`} key={channel.title}>
                <span className={`icon-tile icon-tile-${channel.tone}`}>
                  <Icon name={channel.icon} />
                </span>
                <div>
                  <strong>{channel.title}</strong>
                  <p>{channel.text}</p>
                </div>
                {channel.href && <a href={channel.href}>{channel.action}</a>}
              </article>
            ))}
            <section className={styles.emergencyCard}>
              <h2>¿Viste un animal en peligro?</h2>
              <p>No uses este formulario. Repórtalo y avisaremos a las fundaciones cercanas.</p>
              <a className="btn btn-white" href="/reportar">
                <Icon name="zap" />
                Reportar un caso
              </a>
            </section>
          </aside>
        </div>
        <section id="preguntas" className={styles.faq}>
          <h2>Preguntas frecuentes</h2>
          <div>
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.q} question={faq.q} defaultOpen={index === 0}>
                {faq.a}
              </AccordionItem>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
