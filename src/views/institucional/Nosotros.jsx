import { Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar'
import Icon from '../../components/ui/Icon'
import { Breadcrumbs } from '../../components/ui/Navigation'
import { howItWorks, impactStats, team, values } from '../../data/institutional'
import styles from './Institucional.module.css'

const photos = [
  '/img/fotos/portada-mujer-abrazando-perro.jpg',
  '/img/fotos/mascota-simon-gato.jpg',
  '/img/fotos/mascota-luna-perra.jpg',
]

export default function Nosotros() {
  return (
    <main className={styles.institutionalPage}>
      <title>Nosotros | PetMind</title>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Nosotros' }]} />
        <section className={styles.aboutHero}>
          <div>
            <span className="eyebrow">Nuestra razón de ser</span>
            <h1>
              Conectamos vidas,
              <br />
              <span>cambiamos historias.</span>
            </h1>
            <p>
              PetMind nació en Medellín en 2024 con una idea simple: si juntamos en un solo lugar a las personas que
              quieren ayudar y a las fundaciones que rescatan animales, más peludos pueden tener una segunda
              oportunidad.
            </p>
            <div className={styles.actions}>
              <Link className="btn btn-primary" to="/adoptar">
                Conocer mascotas <Icon name="arrow-right" />
              </Link>
              <Link className="btn btn-secondary" to="/registro/fundacion">
                Registrar una fundación
              </Link>
            </div>
          </div>
          <div className={styles.collage}>
            <img className={styles.collageMain} src={photos[0]} alt="Una familia abraza a su perro" />
            <img src={photos[1]} alt="Gato en adopción" />
            <img src={photos[2]} alt="Perra en adopción" />
            <div className={styles.collageStat}>
              <strong>1.240</strong>
              <span>familias formadas</span>
            </div>
          </div>
        </section>
        <dl className={styles.impact}>
          {impactStats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
        <section className={styles.missionGrid}>
          <article>
            <span className="script">Misión</span>
            <h2>Que ningún animal se quede sin ayuda</h2>
            <p>
              Facilitamos la adopción responsable, las donaciones transparentes y la conexión entre personas y
              fundaciones que trabajan por el bienestar animal.
            </p>
          </article>
          <article>
            <span className="script">Visión</span>
            <h2>La red de bienestar animal más confiable de Latinoamérica</h2>
            <p>
              Para 2030 queremos que cada fundación de la región tenga las herramientas digitales para rescatar, cuidar
              y encontrar hogar a más animales.
            </p>
          </article>
        </section>
        <section className={styles.centerSection}>
          <span className="eyebrow">Lo que nos mueve</span>
          <h2>Nuestros valores</h2>
          <div className={styles.valueGrid}>
            {values.map((item) => (
              <article className="panel panel-sm" key={item.title}>
                <span className={`icon-tile icon-tile-${item.tone}`}>
                  <Icon name={item.icon} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.centerSection}>
          <span className="eyebrow">Así funciona</span>
          <h2>¿Cómo ayuda PetMind?</h2>
          <div className={styles.howGrid}>
            {howItWorks.map((item, index) => (
              <article className="panel panel-sm" key={item.title}>
                <span
                  className={`icon-tile ${item.tone === 'solid-accent' ? 'icon-tile-solid-accent' : 'icon-tile-solid'}`}
                >
                  <Icon name={item.icon} />
                </span>
                <b aria-hidden="true">0{index + 1}</b>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.centerSection}>
          <span className="eyebrow">Las personas detrás</span>
          <h2>Nuestro equipo</h2>
          <div className={styles.teamGrid}>
            {team.map((member) => (
              <article className="panel panel-sm" key={member.name}>
                <Avatar name={member.name} color={member.color} size="xl" />
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.joinBanner}>
          <div>
            <h2>¿Quieres ser parte?</h2>
            <p>Adopta, dona, sé voluntario u hogar de paso. Hay muchas formas de ayudar.</p>
          </div>
          <div>
            <Link className="btn btn-primary" to="/registro">
              Crear mi cuenta
            </Link>
            <Link className="btn btn-secondary" to="/contacto">
              Contáctanos
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
