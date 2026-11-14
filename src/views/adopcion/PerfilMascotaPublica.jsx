import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Avatar from '../../components/ui/Avatar'
import { SexBadge, VerifiedBadge } from '../../components/ui/Badges'
import { Breadcrumbs } from '../../components/ui/Navigation'
import { useMascotasPublicas } from '../../hooks/useMascotasPublicas'
import { useDatosMascotaPublica } from '../../hooks/useDatosMascotaPublica'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useToast } from '../../context/ToastContext'
import { adoptionRequirements, sizeLabel } from '../../data/pets'
import { departmentOf } from '../../data/cities'
import { formatAge, timeAgo } from '../../utils/dates'
import { copyToClipboard } from '../../utils/format'
import NoEncontrada from '../NoEncontrada'
import styles from './PerfilDeLaMascota.module.css'

const speciesPlural = { Perro: 'Perros', Gato: 'Gatos', Otro: 'Otros' }

// La API puede no traer un dato de salud: en ese caso no se afirma ni se niega.
function healthItems(health = {}, sex) {
  const ending = sex === 'Hembra' ? 'a' : 'o'
  return [
    { value: health.vaccinated, yes: 'Vacunas al día', no: 'Vacunas pendientes', unknown: 'Vacunas sin confirmar' },
    { value: health.sterilized, yes: `Esterilizad${ending}`, no: 'Sin esterilizar', unknown: 'Esterilización sin confirmar' },
    { value: health.dewormed, yes: `Desparasitad${ending}`, no: 'Sin desparasitar', unknown: 'Desparasitación sin confirmar' },
    { value: health.microchip, yes: 'Con microchip', no: 'Sin microchip', unknown: 'Microchip sin confirmar' },
  ].map((item) => ({ ok: item.value === true, label: item.value == null ? item.unknown : item.value ? item.yes : item.no }))
}

// Se consulta el listado público para no exponer mascotas que no están disponibles.
export default function PerfilMascotaPublica() {
  const { id } = useParams()
  const { pets, status, retry } = useMascotasPublicas()
  const pet = pets.find((item) => item.id === id)
  const { fundacion } = useDatosMascotaPublica(pet?.foundationId)
  const { isFoundation, isAdmin } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  if (status === 'loading') return <div className="page container" role="status">Cargando mascota…</div>
  if (status === 'error') {
    return (
      <div className="page container" role="alert">
        <p>No fue posible cargar la mascota.</p>
        <button type="button" className="btn btn-outline" onClick={retry}>Reintentar</button>
      </div>
    )
  }
  if (!pet) return <NoEncontrada title="No encontramos esta mascota disponible" backTo="/adoptar" backLabel="Ver mascotas" />

  const department = departmentOf(pet.city)
  const weight = pet.physical?.pesoKg == null ? '—' : `${pet.physical.pesoKg} kg`
  const verified = fundacion?.estadoVerificacion === 'VERIFICADA'
  const facts = [
    ['Especie', pet.species],
    ['Raza', pet.breed],
    ['Color del pelaje', pet.physical?.colorPelaje],
    ['Altura', pet.physical?.alturaCm == null ? null : `${pet.physical.alturaCm} cm`],
  ].filter(([, value]) => value != null && value !== '')
  const foundationMeta = [fundacion?.direccion?.ciudad, fundacion?.contacto?.telefonoPrincipal].filter(Boolean)
  const favorite = isFavorite('pets', pet.id)

  function handleFavorite() {
    const result = toggleFavorite('pets', pet.id, { backendId: pet.backendId })
    if (result === false) {
      navigate('/login', { state: { from: location.pathname, reason: 'favoritos' } })
      return
    }
    if (result) showToast(favorite ? `Quitaste a ${pet.name} de tus favoritos` : `${pet.name} se guardó en tus favoritos`)
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

  // La solicitud se guarda en el backend y le llega a la fundación en su panel.
  const ctaClass = `btn btn-primary btn-block btn-lg ${styles.cta}`
  const cta =
    isFoundation || isAdmin ? (
      <button type="button" className={ctaClass} disabled>
        <Icon name="heart" /> {isFoundation ? 'Las fundaciones no pueden adoptar' : 'Vista del administrador'}
      </button>
    ) : (
      <Link className={ctaClass} to={`/adoptar/backend/${encodeURIComponent(pet.id)}/solicitud`}>
        <Icon name="heart" /> Quiero adoptar a {pet.name}
      </Link>
    )

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
          <section className={styles.gallery} aria-label={`Foto de ${pet.name}`}>
            <div className={styles.mainPhoto}>
              {pet.photo ? (
                <img src={pet.photo} alt={`Foto de ${pet.name}`} />
              ) : (
                <span className={styles.photoEmpty}>
                  <Icon name="image" />
                  Sin foto por ahora
                </span>
              )}
            </div>
          </section>

          <aside className={styles.aside}>
            <section className={styles.infoCard}>
              <div className={styles.nameRow}>
                <h1>{pet.name}</h1>
                {pet.sex && <SexBadge sex={pet.sex} size="lg" />}
                <div className={styles.nameActions}>
                  <button
                    type="button"
                    className={`${styles.squareButton} ${favorite ? styles.squareButtonOn : ''}`}
                    onClick={handleFavorite}
                    aria-pressed={favorite}
                    aria-label={favorite ? `Quitar a ${pet.name} de favoritos` : `Guardar a ${pet.name} en favoritos`}
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
                {department ? `, ${department}` : ''}
                {pet.createdAt ? ` · Publicada ${timeAgo(pet.createdAt)}` : ''}
              </p>

              <dl className={styles.stats}>
                <div className={styles.statMint}>
                  <dt>Edad</dt>
                  <dd>{pet.ageMonths == null ? '—' : formatAge(pet.ageMonths)}</dd>
                </div>
                <div className={styles.statCoral}>
                  <dt>Sexo</dt>
                  <dd>{pet.sex || '—'}</dd>
                </div>
                <div className={styles.statBlue}>
                  <dt>Tamaño</dt>
                  <dd>{sizeLabel(pet.size, pet.sex) || '—'}</dd>
                </div>
                <div className={styles.statAmber}>
                  <dt>Peso</dt>
                  <dd>{weight}</dd>
                </div>
              </dl>

              {fundacion && (
                <div className={styles.foundation}>
                  <Avatar name={fundacion.nombre} src={fundacion.urlLogo || undefined} size="lg" shape="rounded" />
                  <div>
                    <strong>
                      {fundacion.nombre} {verified && <VerifiedBadge />}
                    </strong>
                    {foundationMeta.length > 0 && <span>{foundationMeta.join(' · ')}</span>}
                  </div>
                </div>
              )}

              {cta}
              <p className={styles.free}>
                <Icon name="shield-check" /> Adopción gratuita{verified ? ' · Fundación verificada' : ''}
              </p>
            </section>

            <Link className={styles.questionCard} to={`/contacto?tema=Adopciones&asunto=${encodeURIComponent(`Pregunta sobre ${pet.name}`)}`}>
              <span className="icon-tile icon-tile-info">
                <Icon name="message" />
              </span>
              <span>
                <strong>¿Tienes dudas sobre {pet.name}?</strong>
                <small>Escríbenos y te ponemos en contacto con la fundación</small>
              </span>
              <span className={styles.questionLink}>Escribir</span>
            </Link>
          </aside>
        </div>

        <div className={`${styles.storyGrid} ${styles.details}`}>
          <div className={styles.sideStack}>
            <section className={`panel ${styles.story}`}>
              <h2 className={styles.cardTitle}>Conoce a {pet.name}</h2>
              {pet.description && <p>{pet.description}</p>}
              {pet.story && <p>{pet.story}</p>}
              {!pet.description && !pet.story && <p>La fundación todavía no ha contado la historia de {pet.name}.</p>}
              {pet.traits.length > 0 && (
                <ul className={`chip-list ${styles.traits}`} aria-label="Características">
                  {pet.traits.map((trait) => (
                    <li key={trait} className="chip">
                      {trait}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <h2 className={styles.cardTitle}>Requisitos para adoptar</h2>
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
          </div>

          <div className={styles.sideStack}>
            <section className={`panel panel-sm ${styles.sideCard}`}>
              <h2 className={styles.cardTitle}>Salud</h2>
              <ul className={styles.health}>
                {healthItems(pet.health, pet.sex).map((item) => (
                  <li key={item.label} className={item.ok ? styles.healthOk : ''}>
                    <span className={styles.healthIcon}>{item.ok ? <Icon name="check" strokeWidth={3} /> : <Icon name="minus" strokeWidth={3} />}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
              {pet.physical?.condicionesMedicas && (
                <p className={styles.healthNote}>
                  <strong>Condiciones médicas:</strong> {pet.physical.condicionesMedicas}
                </p>
              )}
              {pet.physical?.cuidadosEspeciales && (
                <p className={styles.healthNote}>
                  <strong>Cuidados especiales:</strong> {pet.physical.cuidadosEspeciales}
                </p>
              )}
            </section>

            {facts.length > 0 && (
              <section className={`panel panel-sm ${styles.sideCard}`}>
                <h2 className={styles.cardTitle}>Ficha</h2>
                <dl className={styles.facts}>
                  {facts.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
