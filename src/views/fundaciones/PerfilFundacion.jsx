import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import CampaignCard from '../../components/cards/CampaignCard'
import PetCard from '../../components/cards/PetCard'
import StoryCard from '../../components/cards/StoryCard'
import Avatar from '../../components/ui/Avatar'
import Icon from '../../components/ui/Icon'
import { VerifiedBadge } from '../../components/ui/Badges'
import { Breadcrumbs, Tabs } from '../../components/ui/Navigation'
import NoEncontrada from '../NoEncontrada'
import { useCampaigns } from '../../context/CampaignsContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { useToast } from '../../context/ToastContext'
import { stories } from '../../data/stories'
import { adoptableStatuses } from '../../data/pets'
import { daysUntil } from '../../utils/dates'
import { formatCOPShort } from '../../utils/format'
import { downloadTextFile } from '../../utils/format'
import styles from './Fundaciones.module.css'

const tabs = [
  { value: 'mascotas', label: 'Mascotas' },
  { value: 'campanas', label: 'Campañas' },
  { value: 'historias', label: 'Historias' },
  { value: 'sobre', label: 'Sobre nosotros' },
  { value: 'resenas', label: 'Reseñas' },
]

export default function PerfilFundacion() {
  const { id } = useParams()
  const { getFoundationById } = useFoundations()
  const { pets } = usePets()
  const { campaigns } = useCampaigns()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { showToast } = useToast()
  const [params, setParams] = useSearchParams()
  const foundation = getFoundationById(id)
  const activeTab = tabs.some((tab) => tab.value === params.get('tab')) ? params.get('tab') : 'mascotas'

  const foundationPets = pets.filter((pet) => pet.foundationId === id && adoptableStatuses.includes(pet.status))
  const activeCampaigns = campaigns.filter((campaign) => campaign.foundationId === id && campaign.status === 'Activa')
  const foundationStories = stories.filter((story) => story.foundationId === id)
  const related = useMemo(
    () => ({
      pets: foundationPets.length,
      campaigns: activeCampaigns.length,
      adoptions: foundation?.stats.adoptions ?? 0,
      stories: foundationStories.length || foundation?.stats.stories || 0,
      reviews: foundation?.stats.reviews ?? 0,
    }),
    [foundationPets.length, activeCampaigns.length, foundationStories.length, foundation],
  )

  if (!foundation)
    return <NoEncontrada title="No encontramos esta fundación" backTo="/fundaciones" backLabel="Ver fundaciones" />

  const favorite = isFavorite('foundations', foundation.id)
  const urgentCampaign = [...activeCampaigns].sort(
    (a, b) => Number(b.urgent) - Number(a.urgent) || daysUntil(a.endDate) - daysUntil(b.endDate),
  )[0]
  const donationUrl = urgentCampaign ? `/donar/${urgentCampaign.id}/aportar` : '/donar/fondo-petmind/aportar'
  const contentTabs = {
    mascotas: (
      <>
        <div className="card-grid">
          {foundationPets.slice(0, 3).map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
        {foundationPets.length === 0 && (
          <div className="empty-state">
            <h3>Pronto publicaremos mascotas</h3>
            <p>Esta fundación todavía no tiene mascotas disponibles.</p>
          </div>
        )}
        <div className={styles.sectionHeading}>
          <h2>Campañas activas</h2>
          <Link className="section-link" to={`/fundaciones/${id}?tab=campanas`}>
            Ver las {activeCampaigns.length} <Icon name="arrow-right" />
          </Link>
        </div>
        <div className="grid-2">
          {activeCampaigns.slice(0, 2).map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </>
    ),
    campanas: activeCampaigns.length ? (
      <div className="card-grid">
        {activeCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <h3>No hay campañas activas</h3>
        <p>Volveremos a publicar cuando la fundación inicie una campaña.</p>
      </div>
    ),
    historias: foundationStories.length ? (
      <div className="card-grid">
        {foundationStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <h3>Aún no hay historias</h3>
        <p>Las historias de esta fundación aparecerán aquí.</p>
      </div>
    ),
    sobre: (
      <section className={`panel ${styles.aboutTab}`}>
        <h2>Sobre {foundation.name}</h2>
        <p>{foundation.about}</p>
        <div className={styles.gallery}>
          {foundation.gallery.map((src) => (
            <img key={src} src={src} alt={`Historia de ${foundation.name}`} />
          ))}
        </div>
      </section>
    ),
    resenas: (
      <section className={`panel ${styles.reviews}`}>
        <h2>Lo que dicen sus adoptantes</h2>
        <p className={styles.reviewSummary}>
          <strong>★ {foundation.stats.rating}</strong> · {foundation.stats.reviews} reseñas
        </p>
        {foundation.reviewsList.slice(0, 3).map((review) => (
          <article key={`${review.author}-${review.date}`}>
            <div>
              <strong>{review.author}</strong>
              <span className={styles.stars}>
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </span>
            </div>
            <p>{review.text}</p>
          </article>
        ))}
        <small>
          Mostrando {foundation.reviewsList.length} de {foundation.stats.reviews} reseñas
        </small>
      </section>
    ),
  }

  function changeTab(value) {
    const next = new URLSearchParams(params)
    next.set('tab', value)
    setParams(next, { replace: true })
  }

  return (
    <main className={styles.profile}>
      <title>{`${foundation.name} | PetMind`}</title>
      <header
        className={styles.cover}
        style={{
          backgroundImage: `linear-gradient(90deg, rgb(8 35 33 / 45%), rgb(8 35 33 / 5%)), url("${foundation.cover}")`,
        }}
      >
        <div className="container">
          <Breadcrumbs light items={[{ label: 'Fundaciones', to: '/fundaciones' }, { label: foundation.name }]} />
        </div>
      </header>
      <div className="container">
        <section className={styles.identity}>
          <Avatar
            initials={foundation.initials}
            color={foundation.color}
            size="xxl"
            shape="rounded"
            className={styles.identityAvatar}
          />
          <div className={styles.identityText}>
            <h1>
              {foundation.name} {foundation.verified && <VerifiedBadge />}
            </h1>
            <p>
              <Icon name="map-pin" /> {foundation.city}, {foundation.department}{' '}
              <span>
                <Icon name="calendar" /> Desde {foundation.since}
              </span>{' '}
              <span>
                <Icon name="paw" /> {foundation.animals.join(' y ').toLowerCase()}
              </span>
            </p>
          </div>
          <div className={styles.identityActions}>
            <button
              type="button"
              className="btn btn-secondary"
              aria-pressed={favorite}
              onClick={() => {
                toggleFavorite('foundations', id)
                showToast(favorite ? 'Quitaste la fundación de tus favoritos' : 'Fundación guardada en favoritos')
              }}
            >
              <Icon name={favorite ? 'heart-filled' : 'heart'} />
              {favorite ? 'Siguiendo' : 'Seguir'}
            </button>
            <a className="btn btn-secondary" href="#contacto">
              <Icon name="message" />
              Contactar
            </a>
            <Link className="btn btn-accent" to={donationUrl}>
              <Icon name="heart" />
              Donar a la fundación
            </Link>
          </div>
        </section>

        <dl className={styles.statsStrip}>
          <div>
            <dt>{related.pets}</dt>
            <dd>mascotas en adopción</dd>
          </div>
          <div>
            <dt>{foundation.stats.adoptions}</dt>
            <dd>adopciones en {new Date().getFullYear()}</dd>
          </div>
          <div>
            <dt>{formatCOPShort(foundation.stats.donations)}</dt>
            <dd>recibidos en donaciones</dd>
          </div>
          <div>
            <dt>{related.campaigns}</dt>
            <dd>campañas activas</dd>
          </div>
          <div>
            <dt>{foundation.stats.rating} ★</dt>
            <dd>de {foundation.stats.reviews} adoptantes</dd>
          </div>
        </dl>

        <div className={styles.profileGrid}>
          <div className={styles.mainColumn}>
            <Tabs
              tabs={tabs.map((tab) => ({
                ...tab,
                count: {
                  mascotas: related.pets,
                  campanas: related.campaigns,
                  historias: related.stories,
                  resenas: related.reviews,
                }[tab.value],
              }))}
              value={activeTab}
              onChange={changeTab}
              label="Información de la fundación"
            />
            <div className={styles.tabContent}>{contentTabs[activeTab]}</div>
          </div>
          <aside className={styles.sideColumn}>
            <section className={`panel panel-sm ${styles.sideCard}`}>
              <h2>Sobre la fundación</h2>
              <p>{foundation.about}</p>
              <blockquote className="script">“{foundation.quote}”</blockquote>
              <div className={styles.miniGallery}>
                {foundation.gallery.map((src) => (
                  <img key={src} src={src} alt="" />
                ))}
              </div>
            </section>
            <section className={`panel panel-sm ${styles.sideCard}`} id="contacto">
              <h2>Contacto</h2>
              <div className={styles.contactRow}>
                <span className="icon-tile icon-tile-neutral">
                  <Icon name="map-pin" />
                </span>
                <div>
                  <strong>{foundation.contact.address}</strong>
                  <small>{foundation.contact.addressNote}</small>
                </div>
              </div>
              <div className={styles.contactRow}>
                <span className="icon-tile icon-tile-neutral">
                  <Icon name="phone" />
                </span>
                <div>
                  <a href={`tel:${foundation.contact.phone}`}>{foundation.contact.phone}</a>
                  <small>{foundation.contact.hours}</small>
                </div>
              </div>
              <div className={styles.contactRow}>
                <span className="icon-tile icon-tile-neutral">
                  <Icon name="mail" />
                </span>
                <div>
                  <a href={`mailto:${foundation.contact.email}`}>{foundation.contact.email}</a>
                  <small>{foundation.contact.response}</small>
                </div>
              </div>
            </section>
            <section className={`panel panel-sm ${styles.sideCard}`}>
              <h2>Transparencia</h2>
              <ul className={styles.transparency}>
                {foundation.transparency.map((item) => (
                  <li key={item.label}>
                    <Icon name="check-circle" />
                    <span>{item.label}</span>
                    {item.value === 'Ver PDF' ? (
                      <button
                        type="button"
                        onClick={() =>
                          downloadTextFile(
                            `informe-${foundation.id}.txt`,
                            `${item.label}\nFundación ${foundation.name}\nDocumento demostrativo de PetMind.`,
                          )
                        }
                      >
                        Ver PDF
                      </button>
                    ) : (
                      <strong>{item.value}</strong>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
