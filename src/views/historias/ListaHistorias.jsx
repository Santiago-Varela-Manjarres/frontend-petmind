import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StoryCard from '../../components/cards/StoryCard'
import BeforeAfter from '../../components/ui/BeforeAfter'
import Icon from '../../components/ui/Icon'
import { Breadcrumbs } from '../../components/ui/Navigation'
import { storyFilters, stories } from '../../data/stories'
import styles from './Historias.module.css'

export default function ListaHistorias() {
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState('recientes')
  const filter = params.get('filtro') ?? 'todas'
  const featured = stories[0]
  const rows = useMemo(() => {
    const filtered = stories.filter((story) => filter === 'todas' || story.type === filter)
    return [...filtered].sort((a, b) =>
      sort === 'queridas' ? b.likes - a.likes : new Date(b.publishedAt) - new Date(a.publishedAt),
    )
  }, [filter, sort])

  return (
    <main className="page">
      <title>Historias | PetMind</title>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Historias' }]} />
        <header className={styles.heading}>
          <h1>
            Historias que <span>inspiran</span>
          </h1>
          <p>Rescates, adopciones y tratamientos reales que fueron posibles gracias a ti.</p>
        </header>

        <section className={styles.featured}>
          <div className={styles.featuredMedia}>
            <BeforeAfter
              before={{ ...featured.before, label: 'Antes · marzo' }}
              after={{ ...featured.after, label: 'Después · agosto' }}
            />
          </div>
          <div className={styles.featuredCopy}>
            <span className="script">Historia destacada</span>
            <h2>{featured.title}</h2>
            <p>{featured.featuredText}</p>
            <dl>
              {featured.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
            <Link className="btn btn-primary" to={`/historias/${featured.id}`}>
              Leer historia completa <Icon name="arrow-right" />
            </Link>
          </div>
        </section>

        <div className={styles.filters}>
          <div className={styles.filterChips} aria-label="Filtrar historias">
            {storyFilters.map((item) => (
              <button
                type="button"
                key={item.value}
                className={`chip-option ${filter === item.value ? 'active' : ''}`}
                onClick={() => {
                  const next = new URLSearchParams(params)
                  item.value === 'todas' ? next.delete('filtro') : next.set('filtro', item.value)
                  setParams(next, { replace: true })
                }}
              >
                {item.icon && <Icon name={item.icon} />}
                {item.label}
              </button>
            ))}
          </div>
          <label className={styles.sort}>
            <span className="sr-only">Ordenar historias</span>
            <select className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="queridas">Más queridas</option>
            </select>
            <Icon name="chevron-down" />
          </label>
        </div>

        {rows.length ? (
          <div className={styles.storyGrid}>
            {rows.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No hay historias con este filtro</h2>
            <p>Elige otro tema para seguir explorando.</p>
          </div>
        )}

        <section className={styles.shareStory}>
          <div className={styles.roundPhotos}>
            <img src="/img/fotos/mascota-luna-perra.jpg" alt="" />
            <img src="/img/fotos/mascota-simon-gato.jpg" alt="" />
            <img src="/img/fotos/mascota-rocky-perro.jpg" alt="" />
          </div>
          <div>
            <span className="script">¿Adoptaste con PetMind?</span>
            <h2>Cuéntanos cómo va su nueva vida</h2>
            <p>Comparte fotos o un video de tu mascota. Tu historia puede animar a otra familia a adoptar.</p>
          </div>
          <Link className="btn btn-accent" to="/contacto?tema=Otro&asunto=Quiero%20compartir%20mi%20historia">
            <Icon name="upload" />
            Compartir mi historia
          </Link>
        </section>
      </div>
    </main>
  )
}
