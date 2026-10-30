import { useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/home/Hero'
import FooterBanner from '../components/home/FooterBanner'
import FeatureCards from '../components/cards/FeatureCards'
import PetCard from '../components/cards/PetCard'
import BeforeAfter from '../components/ui/BeforeAfter'
import Icon from '../components/ui/Icon'
import { useMascotasPublicas } from '../hooks/useMascotasPublicas'
import { homeVideos, stories } from '../data/stories'
import styles from './Inicio.module.css'

const featuredStories = stories.filter((story) => ['rocky-volvio-a-caminar', 'milo-y-ana', 'nala-recupero-la-vista'].includes(story.id))

const Inicio = () => {
  const { pets, status, retry } = useMascotasPublicas()
  const [slide, setSlide] = useState(0)

  const homePets = pets.slice(0, 4)
  const story = featuredStories[slide]

  return (
    <>
      <title>Inicio | PetMind</title>
      <Hero />

      <div className={`container ${styles.features}`}>
        <FeatureCards />
      </div>

      <section className={`container ${styles.section}`}>
        <div className="section-heading">
          <div>
            <h2>Mascotas que buscan un hogar</h2>
            <p>Conoce algunos de los peludos que sueñan con una familia.</p>
          </div>
          <Link className="section-link" to="/adoptar">
            Ver todas las mascotas <Icon name="arrow-right" />
          </Link>
        </div>
        {status === 'loading' && <p role="status">Cargando mascotas disponibles…</p>}
        {status === 'error' && <div role="alert"><p>No fue posible cargar las mascotas.</p><button type="button" className="btn btn-outline" onClick={retry}>Reintentar</button></div>}
        {status === 'success' && homePets.length === 0 && <p>No hay mascotas disponibles por ahora.</p>}
        <div className="card-grid">
          {homePets.map((pet) => (
            <PetCard key={pet.id} pet={pet} variant="home" />
          ))}
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <div className="section-heading">
          <div>
            <h2>Historias que inspiran</h2>
            <p>Conoce cómo tu apoyo cambia vidas reales.</p>
          </div>
          <Link className="section-link" to="/historias">
            Explorar más historias <Icon name="arrow-right" />
          </Link>
        </div>

        <article className={styles.storyCard} aria-roledescription="carrusel" aria-label="Historias destacadas">
          <div className={styles.storyMedia}>
            {story.before ? (
              <BeforeAfter before={{ ...story.before, label: 'Antes' }} after={{ ...story.after, label: 'Después' }} rounded="md" />
            ) : (
              <img className={styles.storyPhoto} src={story.photo} alt="" />
            )}
          </div>
          <div className={styles.storyText}>
            <h3>{story.title}</h3>
            <p>{story.homeExcerpt ?? story.lead}</p>
            <Link className="btn btn-outline" to={`/historias/${story.id}`}>
              Leer historia completa <Icon name="arrow-right" />
            </Link>
          </div>
          <div className={styles.dots}>
            {featuredStories.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.dot} ${index === slide ? styles.dotActive : ''}`}
                onClick={() => setSlide(index)}
                aria-label={`Ver historia ${index + 1}: ${item.title}`}
                aria-current={index === slide}
              />
            ))}
          </div>
        </article>
      </section>

      <section className={`container ${styles.section}`}>
        <div className="section-heading">
          <div>
            <h2>Momentos PetMind</h2>
            <p>Rescates, adopciones, testimonios y mucho más.</p>
          </div>
          <Link className="section-link" to="/historias?filtro=video">
            Ver más videos <Icon name="arrow-right" />
          </Link>
        </div>
        <div className="grid-3">
          {homeVideos.map((video) => (
            <Link key={video.title} className={styles.video} to={`/historias/${video.id}`}>
              <span className={styles.videoMedia}>
                <img src={video.photo} alt="" loading="lazy" />
                <span className={styles.play}>
                  <Icon name="play" />
                </span>
                <span className={styles.duration}>{video.duration}</span>
              </span>
              <span className={styles.videoTitle}>{video.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <FooterBanner />
    </>
  )
}

export default Inicio
