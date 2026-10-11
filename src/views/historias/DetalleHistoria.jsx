import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StoryCard from '../../components/cards/StoryCard'
import Avatar from '../../components/ui/Avatar'
import BeforeAfter from '../../components/ui/BeforeAfter'
import Icon from '../../components/ui/Icon'
import { Breadcrumbs } from '../../components/ui/Navigation'
import NoEncontrada from '../NoEncontrada'
import { stories, getStoryById } from '../../data/stories'
import { useFoundations } from '../../context/FoundationsContext'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/dates'
import { copyToClipboard, formatNumber } from '../../utils/format'
import styles from './Historias.module.css'

export default function DetalleHistoria() {
  const { id } = useParams()
  const story = getStoryById(id)
  const { getFoundationById } = useFoundations()
  const { showToast } = useToast()
  const [liked, setLiked] = useState(false)
  const foundation = story ? getFoundationById(story.foundationId) : null

  if (!story) return <NoEncontrada title="No encontramos esta historia" backTo="/historias" backLabel="Ver historias" />

  const similar = stories.filter((item) => item.id !== story.id).slice(0, 3)
  async function share() {
    const ok = await copyToClipboard(window.location.href)
    showToast(ok ? 'Enlace copiado. ¡Compártelo!' : 'No pudimos copiar el enlace.', { tone: ok ? 'success' : 'error' })
  }

  return (
    <main className={styles.detailPage}>
      <title>{`${story.title} | PetMind`}</title>
      <article className={styles.article}>
        <Breadcrumbs
          items={[
            { label: 'Historias', to: '/historias' },
            { label: story.label, to: `/historias?filtro=${story.type}` },
            { label: story.title },
          ]}
        />
        <span className="badge badge-soft-accent">{story.label}</span>
        <h1>{story.title}</h1>
        <p className={styles.lead}>{story.lead}</p>
        <div className={styles.byline}>
          {foundation && <Avatar initials={foundation.initials} color={foundation.color} size="md" shape="rounded" />}
          <div>
            <strong>
              {foundation?.name ?? 'Comunidad PetMind'}{' '}
              {foundation?.verified && <span className={styles.verified}>✓</span>}
            </strong>
            <span>
              Publicado el {formatDate(story.publishedAt, { year: true })} · {story.readTime} min de lectura
            </span>
          </div>
          <div className={styles.articleActions}>
            <button
              type="button"
              className={liked ? styles.liked : ''}
              onClick={() => setLiked((value) => !value)}
              aria-pressed={liked}
              aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
            >
              <Icon name={liked ? 'heart-filled' : 'heart'} />
              {formatNumber(story.likes + Number(liked))}
            </button>
            <button type="button" onClick={share} aria-label="Copiar enlace">
              <Icon name="share" />
            </button>
          </div>
        </div>

        {story.before && story.after ? (
          <div className={styles.comparison}>
            <BeforeAfter interactive before={story.before} after={story.after} />
            <p>Desliza para comparar el antes y el después.</p>
          </div>
        ) : (
          <img className={styles.heroPhoto} src={story.photo} alt={story.title} />
        )}
        <div className={styles.storyBody}>
          {story.body?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {story.journey?.length > 0 && (
          <section className={styles.journey}>
            <h2>El camino de {story.title.split(' ')[0]}</h2>
            <ol>
              {story.journey.map((item) => (
                <li key={item.title}>
                  <span className={styles[`journey-${item.tone}`]}>
                    <Icon name={item.icon} />
                  </span>
                  <strong>{item.title}</strong>
                  {item.lines.map((line) => (
                    <small key={line}>{line}</small>
                  ))}
                </li>
              ))}
            </ol>
          </section>
        )}
        {story.quote && (
          <blockquote className={styles.quote}>
            <p>“{story.quote.text}”</p>
            <cite>— {story.quote.author}</cite>
          </blockquote>
        )}
        {story.closing && <p className={styles.closing}>{story.closing}</p>}
        {story.video && (
          <button
            type="button"
            className={styles.videoCard}
            onClick={() => showToast('El video estará disponible cuando conectemos el backend.', { tone: 'info' })}
          >
            <span>
              <img src={story.video.thumbnail} alt="" />
              <Icon name="play" />
            </span>
            <strong>
              {story.video.title} · {story.video.duration}
            </strong>
            <small>Ver video</small>
          </button>
        )}

        <section className={styles.donors}>
          <h2>
            Gracias a {story.donorsTotal} personas que lo hicieron posible <span>♡</span>
          </h2>
          <div>
            {story.donors.slice(0, 11).map((name, index) => (
              <span className={styles.donor} key={`${name}-${index}`}>
                <Avatar
                  initials={
                    name === 'Anónimo'
                      ? 'AN'
                      : name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                  }
                  color={['primary', 'accent', 'info', 'purple'][index % 4]}
                  size="xs"
                />
                {name}
              </span>
            ))}
            {story.donorsTotal > story.donors.length && (
              <span className={styles.moreDonors}>+{story.donorsTotal - story.donors.length} más</span>
            )}
          </div>
        </section>
        <div className={styles.ctaGrid}>
          <section>
            <h2>{story.ctas.adopt.title}</h2>
            <p>{story.ctas.adopt.text}</p>
            <Link
              className="btn btn-white btn-sm"
              to={story.ctas.adopt.to ?? `/adoptar?fundacion=${story.foundationId}`}
            >
              {story.ctas.adopt.label} <Icon name="arrow-right" />
            </Link>
          </section>
          <section>
            <h2>{story.ctas.donate.title}</h2>
            <p>{story.ctas.donate.text}</p>
            <Link className="btn btn-white btn-sm" to={`/donar/${story.ctas.donate.campaignId}/aportar`}>
              {story.ctas.donate.label} <Icon name="arrow-right" />
            </Link>
          </section>
        </div>
      </article>
      <section className={styles.moreStories}>
        <div className="section-heading">
          <h2>Más historias que inspiran</h2>
          <Link className="section-link" to="/historias">
            Ver todas <Icon name="arrow-right" />
          </Link>
        </div>
        <div className="card-grid">
          {similar.map((item) => (
            <StoryCard key={item.id} story={item} />
          ))}
        </div>
      </section>
    </main>
  )
}
