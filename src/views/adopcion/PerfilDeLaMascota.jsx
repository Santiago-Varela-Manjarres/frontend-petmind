import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import PetCard from '../../components/cards/PetCard'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { SexBadge, VerifiedBadge } from '../../components/ui/Badges'
import { AccordionItem, Breadcrumbs, Tabs } from '../../components/ui/Navigation'
import NoEncontrada from '../NoEncontrada'
import { usePets } from '../../context/PetsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { adoptionRequirements, isAdoptable, sizeLabel } from '../../data/pets'
import { departmentOf } from '../../data/cities'
import { formatAge, timeAgo } from '../../utils/dates'
import { copyToClipboard } from '../../utils/format'
import { isHidden } from '../../utils/moderation'
import styles from './PerfilDeLaMascota.module.css'

const speciesPlural = { Perro: 'Perros', Gato: 'Gatos', Otro: 'Otros' }

const steps = [
  { title: 'Llenas el formulario', text: 'Nos cuentas sobre ti y tu hogar. Toma unos 8 minutos.' },
  { title: 'Entrevista virtual', text: 'La fundación te conoce y resuelve tus dudas.' },
  { title: 'Visita al hogar', text: 'Verifican que {name} tendrá un espacio seguro.' },
  { title: '¡Bienvenida a casa!', text: 'Firmas el compromiso y recibes acompañamiento.' },
]

const personalityRows = [
  { key: 'energy', label: 'Nivel de energía', tone: 'warning' },
  { key: 'dogs', label: 'Con otros perros', tone: 'primary' },
  { key: 'cats', label: 'Con gatos', tone: 'info' },
  { key: 'kids', label: 'Con niños', tone: 'accent' },
]

function healthItems(pet) {
  const female = pet.sex === 'Hembra'
  const ending = female ? 'a' : 'o'
  return [
    { ok: pet.health?.vaccinated, label: pet.health?.vaccinated ? 'Vacunas al día' : 'Vacunas pendientes' },
    { ok: pet.health?.sterilized, label: pet.health?.sterilized ? `Esterilizad${ending}` : `Sin esterilizar` },
    { ok: pet.health?.dewormed, label: pet.health?.dewormed ? `Desparasitad${ending}` : 'Sin desparasitar' },
    { ok: pet.health?.microchip, label: pet.health?.microchip ? 'Con microchip' : 'Sin microchip' },
  ]
}

function HealthCard({ pet }) {
  return (
    <section className={`panel panel-sm ${styles.sideCard}`}>
      <h2 className={styles.cardTitle}>Salud</h2>
      <ul className={styles.health}>
        {healthItems(pet).map((item) => (
          <li key={item.label} className={item.ok ? styles.healthOk : ''}>
            <span className={styles.healthIcon}>{item.ok ? <Icon name="check" strokeWidth={3} /> : <Icon name="minus" strokeWidth={3} />}</span>
            {item.label}
          </li>
        ))}
      </ul>
      {pet.healthNotes && <p className={styles.healthNote}>{pet.healthNotes}</p>}
    </section>
  )
}

function PersonalityCard({ pet }) {
  if (!pet.personality) return null
  return (
    <section className={`panel panel-sm ${styles.sideCard}`}>
      <h2 className={styles.cardTitle}>Personalidad</h2>
      <dl className={styles.personality}>
        {personalityRows.map((row) => {
          const item = pet.personality[row.key]
          if (!item) return null
          return (
            <div key={row.key}>
              <dt>{row.label}</dt>
              <dd>
                <span className={styles.bar}>
                  <span className={`${styles.barFill} ${styles[`bar-${row.tone}`]}`} style={{ width: `${item.value}%` }} />
                </span>
                <span className={styles.barLabel}>{item.label}</span>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

// 02 · Adopción / 02 · Perfil de la mascota
const PerfilDeLaMascota = () => {
  const { id } = useParams()
  const { pets, getPetById } = usePets()
  const { getFoundationById } = useFoundations()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isFoundation, isAdmin } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [photoIndex, setPhotoIndex] = useState(0)
  const [tab, setTab] = useState('historia')

  // Al pasar a otra mascota (desde "Otros peludos"), volver a la primera foto y pestaña.
  const [lastId, setLastId] = useState(id)
  if (lastId !== id) {
    setLastId(id)
    setPhotoIndex(0)
    setTab('historia')
  }

  const pet = getPetById(id)
  // Una publicación retirada por PetMind solo la sigue viendo el administrador (para revisarla).
  if (!pet || (isHidden(pet) && !isAdmin)) {
    return <NoEncontrada title="No encontramos esta mascota" text="Puede que ya haya encontrado hogar o que el enlace esté mal escrito." backTo="/adoptar" backLabel="Ver mascotas en adopción" />
  }

  const foundation = getFoundationById(pet.foundationId)
  const gallery = pet.gallery?.length ? pet.gallery : [{ src: pet.photo }]
  const current = gallery[Math.min(photoIndex, gallery.length - 1)]
  const favorite = isFavorite('pets', pet.id)
  const canAdopt = isAdoptable(pet)
  const department = departmentOf(pet.city)
  const similar = pets
    .filter((item) => item.id !== pet.id && isAdoptable(item))
    .sort((a, b) => Number(b.species === pet.species) - Number(a.species === pet.species))
    .slice(0, 4)

  function move(step) {
    setPhotoIndex((prev) => (prev + step + gallery.length) % gallery.length)
  }

  function handleFavorite() {
    if (!toggleFavorite('pets', pet.id)) {
      navigate('/login', { state: { from: location.pathname, reason: 'favoritos' } })
      return
    }
    showToast(favorite ? `Quitaste a ${pet.name} de tus favoritos` : `${pet.name} se guardó en tus favoritos`)
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: `${pet.name} busca hogar · PetMind`, url })
        return
      } catch {
        // cancelado: seguimos con copiar
      }
    }
    const ok = await copyToClipboard(url)
    showToast(ok ? 'Enlace copiado. ¡Compártelo!' : 'No pudimos copiar el enlace.', { tone: ok ? 'success' : 'error' })
  }

  const tabs = [
    { value: 'historia', label: 'Su historia' },
    { value: 'personalidad', label: 'Personalidad' },
    { value: 'salud', label: 'Salud' },
    { value: 'requisitos', label: 'Requisitos' },
    { value: 'preguntas', label: `Preguntas (${pet.questions?.length ?? 0})` },
  ]

  return (
    <div className="page">
      <title>{`${pet.name} | PetMind`}</title>

      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Adoptar', to: '/adoptar' },
            { label: speciesPlural[pet.species] ?? 'Mascotas', to: `/adoptar?especie=${pet.species}` },
            { label: pet.name },
          ]}
        />

        <div className={styles.top}>
          <section className={styles.gallery} aria-label={`Fotos de ${pet.name}`}>
            <div className={styles.mainPhoto}>
              <img src={current.src} alt={`${pet.name}, foto ${photoIndex + 1}`} style={{ objectPosition: current.position ?? 'center' }} />
              {gallery.length > 1 && (
                <>
                  <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => move(-1)} aria-label="Foto anterior">
                    <Icon name="chevron-left" strokeWidth={2.2} />
                  </button>
                  <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => move(1)} aria-label="Foto siguiente">
                    <Icon name="chevron-right" strokeWidth={2.2} />
                  </button>
                </>
              )}
              <span className={styles.counter}>
                <Icon name="grid" /> {photoIndex + 1} / {gallery.length} fotos
              </span>
              {!canAdopt && <span className={styles.statusBanner}>{isHidden(pet) ? 'Retirada por PetMind' : pet.status === 'Adoptado' ? '¡Ya encontró hogar!' : `${pet.status}${pet.statusNote ? ` · ${pet.statusNote}` : ''}`}</span>}
            </div>
            {gallery.length > 1 && (
              <div className={styles.thumbs}>
                {gallery.map((item, index) => (
                  <button
                    key={`${item.src}-${index}`}
                    type="button"
                    className={`${styles.thumb} ${index === photoIndex ? styles.thumbActive : ''}`}
                    onClick={() => setPhotoIndex(index)}
                    aria-label={`Ver foto ${index + 1}`}
                    aria-current={index === photoIndex}
                  >
                    <img src={item.src} alt="" style={{ objectPosition: item.position ?? 'center' }} />
                    {item.video && (
                      <span className={styles.thumbVideo}>
                        <Icon name="video" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className={styles.aside}>
            <section className={styles.infoCard}>
              <div className={styles.nameRow}>
                <h1>{pet.name}</h1>
                <SexBadge sex={pet.sex} size="lg" />
                <div className={styles.nameActions}>
                  <button
                    type="button"
                    className={`${styles.squareButton} ${favorite ? styles.squareButtonOn : ''}`}
                    onClick={handleFavorite}
                    aria-pressed={favorite}
                    aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  >
                    <Icon name={favorite ? 'heart-filled' : 'heart'} />
                  </button>
                  <button type="button" className={styles.squareButton} onClick={handleShare} aria-label="Compartir">
                    <Icon name="share" />
                  </button>
                </div>
              </div>
              <p className={styles.location}>
                <Icon name="map-pin" /> {pet.city}
                {department ? `, ${department}` : ''} · Publicada {timeAgo(pet.createdAt)}
              </p>

              <dl className={styles.stats}>
                <div className={styles.statMint}>
                  <dt>Edad</dt>
                  <dd>{formatAge(pet.ageMonths)}</dd>
                </div>
                <div className={styles.statCoral}>
                  <dt>Sexo</dt>
                  <dd>{pet.sex}</dd>
                </div>
                <div className={styles.statBlue}>
                  <dt>Tamaño</dt>
                  <dd>{sizeLabel(pet.size, pet.sex)}</dd>
                </div>
                <div className={styles.statAmber}>
                  <dt>Peso</dt>
                  <dd>{pet.weight || '—'}</dd>
                </div>
              </dl>

              {foundation && (
                <div className={styles.foundation}>
                  <Avatar initials={foundation.initials} color={foundation.color} size="lg" shape="rounded" />
                  <div>
                    <strong>
                      {foundation.name} {foundation.verified && <VerifiedBadge />}
                    </strong>
                    <span>
                      {foundation.city} · {foundation.stats.adoptions} adopciones logradas
                    </span>
                  </div>
                  <Link className="link" to={`/fundaciones/${foundation.id}`}>
                    Ver perfil
                  </Link>
                </div>
              )}

              {canAdopt && !isFoundation && !isAdmin ? (
                <Link className={`btn btn-primary btn-block btn-lg ${styles.cta}`} to={`/adoptar/${pet.id}/solicitud`}>
                  <Icon name="heart" /> Quiero adoptar a {pet.name}
                </Link>
              ) : (
                <button type="button" className={`btn btn-primary btn-block btn-lg ${styles.cta}`} disabled>
                  <Icon name="heart" />{' '}
                  {isFoundation && canAdopt
                    ? 'Las fundaciones no pueden adoptar'
                    : isAdmin && canAdopt
                      ? 'Vista del administrador'
                      : 'No disponible para adopción'}
                </button>
              )}
              <Link className={`btn btn-accent-soft btn-block btn-lg ${styles.cta}`} to={`/donar/fondo-petmind/aportar?para=${pet.id}`}>
                <Icon name="heart-filled" /> Apadrinar su cuidado
              </Link>
              <p className={styles.free}>
                <Icon name="shield-check" /> Adopción gratuita · Fundación verificada
              </p>
            </section>

            <Link className={styles.questionCard} to={`/contacto?tema=Adopciones&asunto=${encodeURIComponent(`Pregunta sobre ${pet.name}`)}`}>
              <span className="icon-tile icon-tile-info">
                <Icon name="message" />
              </span>
              <span>
                <strong>¿Tienes dudas sobre {pet.name}?</strong>
                <small>La fundación responde en {foundation?.contact?.response?.replace('Respuesta en ', '') || '~2 horas'}</small>
              </span>
              <span className={styles.questionLink}>Escribir</span>
            </Link>
          </aside>
        </div>

        <Tabs tabs={tabs} value={tab} onChange={setTab} label={`Información de ${pet.name}`} className={styles.tabs} />

        <div className={styles.tabPanel} role="tabpanel">
          {tab === 'historia' && (
            <div className={styles.storyGrid}>
              <section className={`panel ${styles.story}`}>
                <h2 className={styles.cardTitle}>La historia de {pet.name}</h2>
                {(pet.story ?? []).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {pet.quote && (
                  <blockquote className={styles.quote}>
                    <p>“{pet.quote.text}”</p>
                    <cite>— {pet.quote.author}</cite>
                  </blockquote>
                )}
              </section>
              <div className={styles.sideStack}>
                <PersonalityCard pet={pet} />
                <HealthCard pet={pet} />
              </div>
            </div>
          )}

          {tab === 'personalidad' && (
            <div className={styles.storyGrid}>
              <PersonalityCard pet={pet} />
              <section className={`panel panel-sm ${styles.sideCard}`}>
                <h2 className={styles.cardTitle}>Así es {pet.name}</h2>
                <ul className="chip-list">
                  {(pet.traits ?? []).map((trait) => (
                    <li key={trait} className="chip">
                      {trait}
                    </li>
                  ))}
                </ul>
                <ul className={styles.compat}>
                  <li>{pet.goodWithKids ? '✓ Se lleva bien con niños' : '• Mejor en un hogar sin niños pequeños'}</li>
                  <li>{pet.goodWithDogs ? '✓ Convive con otros perros' : '• Mejor sin otros perros'}</li>
                  <li>{pet.goodWithCats ? '✓ Convive con gatos' : '• Mejor sin gatos'}</li>
                </ul>
              </section>
            </div>
          )}

          {tab === 'salud' && (
            <div className={styles.narrow}>
              <HealthCard pet={pet} />
            </div>
          )}

          {tab === 'requisitos' && (
            <section className={`panel ${styles.narrow}`}>
              <h2 className={styles.cardTitle}>Requisitos para adoptar a {pet.name}</h2>
              <ul className={styles.requirements}>
                {adoptionRequirements.map((item) => (
                  <li key={item}>
                    <span className={styles.healthIcon}>
                      <Icon name="check" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === 'preguntas' && (
            <div className={styles.questions}>
              {(pet.questions ?? []).map((item, index) => (
                <AccordionItem key={item.q} question={item.q} defaultOpen={index === 0}>
                  {item.a}
                </AccordionItem>
              ))}
            </div>
          )}
        </div>

        <section className={styles.how}>
          <span className="script">Adoptar es más fácil de lo que crees</span>
          <h2>¿Cómo funciona la adopción?</h2>
          <ol className={styles.howSteps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.howNumber}>{index + 1}</span>
                <strong>{step.title}</strong>
                <p>{step.text.replace('{name}', pet.name)}</p>
              </li>
            ))}
          </ol>
        </section>

        {similar.length > 0 && (
          <section className={styles.similar}>
            <div className="section-heading">
              <div>
                <h2>Otros peludos que te pueden gustar</h2>
                <p>Con características parecidas a {pet.name}.</p>
              </div>
              <Link className="section-link" to="/adoptar">
                Ver todas <Icon name="arrow-right" />
              </Link>
            </div>
            <div className="card-grid">
              {similar.map((item) => (
                <PetCard key={item.id} pet={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default PerfilDeLaMascota
