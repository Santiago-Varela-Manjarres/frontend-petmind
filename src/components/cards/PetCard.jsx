import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { SexBadge, VerifiedBadge } from '../ui/Badges'
import { useFavorites } from '../../context/FavoritesContext'
import { useFoundations } from '../../context/FoundationsContext'
import { useToast } from '../../context/ToastContext'
import { sizeLabel } from '../../data/pets'
import { formatAge, isWithinDays } from '../../utils/dates'
import styles from './PetCard.module.css'

// Tarjeta de mascota (mockup 02 · Adopción / 01). variant "home" es la versión simple del inicio.
export default function PetCard({ pet, variant = 'default', preview = false }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { getFoundationById } = useFoundations()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  if (!pet) return null

  const foundation = pet.source === 'backend' ? null : getFoundationById(pet.foundationId)
  const favorite = isFavorite('pets', pet.id)
  const adopted = pet.status === 'Adoptado'
  const isNew = !pet.urgent && isWithinDays(pet.createdAt, 7)
  const age = pet.ageMonths == null ? '' : formatAge(pet.ageMonths)
  const size = sizeLabel(pet.size, pet.sex)
  const meta = variant === 'home' ? [pet.sex, age, pet.city] : [age, size, pet.city]
  const profileUrl = pet.source === 'backend' ? `/adoptar/backend/${encodeURIComponent(pet.id)}` : `/adoptar/${pet.id}`
  const traits = (pet.traits ?? []).slice(0, 3)

  function handleFavorite() {
    if (preview) return
    if (!toggleFavorite('pets', pet.id)) {
      navigate('/login', { state: { from: location.pathname, reason: 'favoritos' } })
      return
    }
    showToast(favorite ? `Quitaste a ${pet.name} de tus favoritos` : `${pet.name} se guardó en tus favoritos`)
  }

  const Photo = preview ? 'div' : Link

  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.media}>
        <Photo className={styles.photoLink} {...(preview ? {} : { to: profileUrl, 'aria-label': `Ver perfil de ${pet.name}` })}>
          {pet.photo ? (
            <img className={styles.photo} src={pet.photo} alt={`Foto de ${pet.name}`} loading="lazy" />
          ) : (
            <span className={styles.photoEmpty}>
              <Icon name="image" />
            </span>
          )}
          {adopted && <span className={styles.adopted}>¡Ya fue adoptado!</span>}
        </Photo>

        {!adopted && pet.urgent && <span className={`${styles.badge} ${styles.urgent}`}>Urgente</span>}
        {!adopted && isNew && <span className={`${styles.badge} ${styles.new}`}>Nuevo</span>}

        {pet.source !== 'backend' && <button
          type="button"
          className={`${styles.favorite} ${favorite ? styles.favoriteOn : ''} ${adopted ? styles.favoriteMuted : ''}`}
          onClick={handleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? `Quitar a ${pet.name} de favoritos` : `Guardar a ${pet.name} en favoritos`}
        >
          <Icon name={favorite ? 'heart-filled' : 'heart'} strokeWidth={2} />
        </button>}
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>{pet.name}</h3>
          {variant !== 'home' && pet.sex && <SexBadge sex={pet.sex} size="sm" />}
        </div>

        <p className={styles.meta}>
          {variant !== 'home' && <Icon name="map-pin" />}
          {meta.filter(Boolean).join(' · ')}
        </p>

        {traits.length > 0 && (
          <ul className={styles.traits} aria-label="Características">
            {traits.map((trait) => (
              <li key={trait} className="chip">
                {trait}
              </li>
            ))}
          </ul>
        )}

        {variant !== 'home' && foundation && (
          <p className={styles.foundation}>
            <Avatar initials={foundation.initials} color={foundation.color} size="xs" shape="rounded" />
            <span>{foundation.name}</span>
            {foundation.verified && <VerifiedBadge size="sm" />}
          </p>
        )}

        {preview ? (
          <span className={`btn btn-outline btn-block ${styles.cta}`}>
            Conocer a {pet.name || 'tu mascota'} <Icon name="arrow-right" />
          </span>
        ) : (
          <Link className={`btn btn-outline btn-block ${styles.cta}`} to={profileUrl}>
            Conocer a {pet.name} <Icon name="arrow-right" />
          </Link>
        )}
      </div>
    </article>
  )
}
