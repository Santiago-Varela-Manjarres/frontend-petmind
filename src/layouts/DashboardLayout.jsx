import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/ui/Logo'
import Icon from '../components/ui/Icon'
import Avatar from '../components/ui/Avatar'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { useTheme } from '../context/ThemeContext'
import { useFoundations } from '../context/FoundationsContext'
import { useAdoptions } from '../context/AdoptionsContext'
import { useFavorites } from '../context/FavoritesContext'
import { useReports } from '../context/ReportsContext'
import { usePets } from '../context/PetsContext'
import { useCampaigns } from '../context/CampaignsContext'
import { finishedStages } from '../data/adoptions'
import { fullName } from '../data/users'
import styles from './DashboardLayout.module.css'
import PageLoader from '../components/layout/PageLoader'

// Panel del usuario (07) y panel de la fundación (08): menú lateral + barra superior.
export default function DashboardLayout({ variant = 'persona' }) {
  const { user } = useAuth()
  const handleLogout = useLogout()
  const { theme, toggleTheme } = useTheme()
  const { getFoundationById } = useFoundations()
  const { requests } = useAdoptions()
  const { favorites } = useFavorites()
  const { reports } = useReports()
  const { pets } = usePets()
  const { campaigns } = useCampaigns()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  // Ctrl + K enfoca el buscador, como indica el atajo del mockup.
  useEffect(() => {
    function handleKey(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const isFoundation = variant === 'fundacion'
  const foundation = isFoundation ? getFoundationById(user.foundationId) : null

  const myRequests = requests.filter((request) => request.userId === user.id)
  const activeRequests = myRequests.filter((request) => request.stage !== 'borrador' && !finishedStages.includes(request.stage))
  const unread = myRequests.reduce((total, request) => total + (request.messages ?? []).filter((m) => m.from === 'foundation' && !m.read).length, 0)

  const foundationRequests = requests.filter((request) => request.foundationId === user.foundationId && request.stage !== 'borrador')
  const newRequests = foundationRequests.filter((request) => request.stage === 'nueva' || request.stage === 'revision')
  const foundationPets = pets.filter((pet) => pet.foundationId === user.foundationId && pet.status !== 'Adoptado')
  const foundationCampaigns = campaigns.filter((campaign) => campaign.foundationId === user.foundationId)
  const nearbyReports = reports.filter((report) => report.notified?.some((item) => item.foundationId === user.foundationId))

  const sections = isFoundation
    ? [
        {
          title: 'Gestión',
          items: [
            { to: '/fundacion', label: 'Resumen', icon: 'home', end: true },
            { to: '/fundacion/mascotas', label: 'Mis mascotas', icon: 'paw', count: foundationPets.length },
            { to: '/fundacion/solicitudes', label: 'Solicitudes', icon: 'file', count: newRequests.length, alert: true },
            { to: '/fundacion/campanas', label: 'Campañas', icon: 'heart', count: foundationCampaigns.length },
            { to: '/fundacion/donaciones', label: 'Donaciones', icon: 'star' },
            { to: '/fundacion/reportes', label: 'Reportes cercanos', icon: 'zap', count: nearbyReports.length, alert: true },
            { to: '/fundacion/mensajes', label: 'Mensajes', icon: 'message', count: 5, alert: true },
          ],
        },
        {
          title: 'Fundación',
          items: [
            { to: `/fundaciones/${user.foundationId}`, label: 'Perfil público', icon: 'user', external: true },
            { to: '/fundacion/equipo', label: 'Equipo', icon: 'users' },
            { to: '/fundacion/documentos', label: 'Documentos', icon: 'shield-check' },
          ],
        },
      ]
    : [
        {
          title: 'Mi cuenta',
          items: [
            { to: '/cuenta', label: 'Resumen', icon: 'home', end: true },
            { to: '/cuenta/solicitudes', label: 'Mis solicitudes', icon: 'file', count: activeRequests.length, alert: true },
            { to: '/cuenta/favoritos', label: 'Favoritos', icon: 'heart', count: favorites.pets.length },
            { to: '/cuenta/donaciones', label: 'Mis donaciones', icon: 'star' },
            { to: '/cuenta/reportes', label: 'Mis reportes', icon: 'zap', count: reports.filter((report) => report.userId === user.id).length },
            { to: '/cuenta/mensajes', label: 'Mensajes', icon: 'message', count: unread, alert: true },
          ],
        },
        {
          title: 'Ajustes',
          items: [
            { to: '/cuenta/perfil', label: 'Mi perfil', icon: 'user', end: true },
            { to: '/cuenta/perfil#notificaciones', label: 'Notificaciones', icon: 'bell', hash: true },
            { to: '/cuenta/perfil#seguridad', label: 'Seguridad', icon: 'shield-check', hash: true },
          ],
        },
      ]

  const name = isFoundation ? (foundation?.name ?? user.name) : fullName(user)
  const role = isFoundation ? (foundation?.verified ? 'Fundación verificada' : 'Verificación en proceso') : 'Adoptante y donante'

  function handleSearch(event) {
    event.preventDefault()
    const text = query.trim()
    const base = isFoundation ? '/fundacion/mascotas' : '/adoptar'
    navigate(text ? `${base}?q=${encodeURIComponent(text)}` : base)
    setQuery('')
  }

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`} aria-label={isFoundation ? 'Menú del panel de fundación' : 'Menú de mi cuenta'}>
        <div className={styles.sidebarTop}>
          <Logo subtitle={isFoundation ? 'Panel de fundación' : 'Mi cuenta'} to={isFoundation ? '/fundacion' : '/cuenta'} />
          <button type="button" className={`icon-btn ${styles.closeButton}`} onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <Icon name="x" />
          </button>
        </div>

        <div className={styles.userCard}>
          <Avatar name={name} src={user.avatar} color="primary" size="md" />
          <div>
            <strong>{name}</strong>
            <span>{role}</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {sections.map((section) => (
            <div key={section.title} className={styles.section}>
              <p className={styles.sectionTitle}>{section.title}</p>
              <ul>
                {section.items.map((item) => (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => `${styles.navItem} ${isActive && !item.hash && !item.external ? styles.navItemActive : ''}`}
                    >
                      <Icon name={item.icon} />
                      <span>{item.label}</span>
                      {item.count > 0 && <span className={`count-badge ${item.alert ? 'count-badge-accent' : ''}`}>{item.count}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button type="button" className={styles.logout} onClick={handleLogout}>
            <Icon name="log-out" />
            Cerrar sesión
          </button>
        </nav>

        <Link to={isFoundation ? '/fundacion/mascotas/nueva' : '/contacto#preguntas'} className={styles.helpCard}>
          <span className="script">{isFoundation ? 'Tip del día' : '¿Necesitas ayuda?'}</span>
          <strong>{isFoundation ? 'Fotos que enamoran' : 'Centro de ayuda'}</strong>
          <small>{isFoundation ? 'Las mascotas con 4+ fotos se adoptan 2× más rápido' : 'Guías y preguntas frecuentes'}</small>
        </Link>
      </aside>

      {open && <button type="button" className={styles.backdrop} onClick={() => setOpen(false)} aria-label="Cerrar menú" />}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={`icon-btn ${styles.menuButton}`} onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Icon name="menu" />
          </button>

          <form className={styles.search} onSubmit={handleSearch} role="search">
            <Icon name="search" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar..."
              aria-label={isFoundation ? 'Buscar en mis mascotas' : 'Buscar mascotas'}
            />
            <kbd className="kbd">Ctrl K</kbd>
          </form>

          <div className={styles.topActions}>
            <Link className={`btn btn-soft ${styles.siteButton}`} to={isFoundation ? `/fundaciones/${user.foundationId}` : '/'}>
              <Icon name="home" />
              <span>{isFoundation ? 'Ver perfil público' : 'Ver sitio'}</span>
            </Link>
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <Link className="icon-btn" to={isFoundation ? '/fundacion/mensajes' : '/cuenta/mensajes'} aria-label="Mensajes">
              <Icon name="message" />
            </Link>
            <Link className={`icon-btn ${styles.bell}`} to={isFoundation ? '/fundacion' : '/cuenta/perfil#notificaciones'} aria-label="Notificaciones">
              <Icon name="bell" />
              <span className={styles.bellDot} />
            </Link>
          </div>
        </header>

        <main className={styles.content}>
          {/* Las pantallas se cargan bajo demanda: el menú se queda visible mientras llegan. */}
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
        </main>
      </div>
    </div>
  )
}
