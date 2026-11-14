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
import { verificationOf } from '../data/foundations'
import { fullName } from '../data/users'
import styles from './DashboardLayout.module.css'
import PageLoader from '../components/layout/PageLoader'

// Etiqueta bajo el nombre de la fundación, según lo que decidió el equipo PetMind.
const foundationRoles = {
  verificada: 'Fundación verificada',
  pendiente: 'Verificación en proceso',
  rechazada: 'Verificación rechazada',
  suspendida: 'Perfil suspendido',
}

// Secciones del panel de administración que filtran con el buscador de la barra superior (?q=).
const adminSearchable = ['fundaciones', 'mascotas', 'campanas', 'historias', 'reportes', 'usuarios', 'donaciones']

// Panel del usuario (07), panel de la fundación (08) y panel de administración: menú lateral + barra superior.
// variant: persona · fundacion · admin
export default function DashboardLayout({ variant = 'persona' }) {
  const { user } = useAuth()
  const handleLogout = useLogout()
  const { theme, toggleTheme } = useTheme()
  const { foundations, getFoundationById } = useFoundations()
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

  // Menú, textos y accesos de cada panel (las funciones están más abajo).
  const panel = variant === 'admin' ? adminPanel() : variant === 'fundacion' ? foundationPanel() : personaPanel()

  function personaPanel() {
    const myRequests = requests.filter((request) => request.userId === user.id)
    const activeRequests = myRequests.filter((request) => request.stage !== 'borrador' && !finishedStages.includes(request.stage))
    const unread = myRequests.reduce(
      (total, request) => total + (request.messages ?? []).filter((m) => m.from === 'foundation' && !m.read).length,
      0,
    )
    return {
      menuLabel: 'Menú de mi cuenta',
      subtitle: 'Mi cuenta',
      home: '/cuenta',
      name: fullName(user),
      role: 'Adoptante y donante',
      sections: [
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
      ],
      searchBase: '/adoptar',
      searchLabel: 'Buscar mascotas',
      site: { to: '/', label: 'Ver sitio' },
      messages: '/cuenta/mensajes',
      notifications: '/cuenta/perfil#notificaciones',
      help: { to: '/contacto#preguntas', script: '¿Necesitas ayuda?', title: 'Centro de ayuda', text: 'Guías y preguntas frecuentes' },
    }
  }

  // Cuenta de una fundación del backend: publica sus mascotas y campañas y gestiona las solicitudes de adopción.
  function apiFoundationPanel() {
    return {
      menuLabel: 'Menú del panel de fundación',
      subtitle: 'Panel de fundación',
      home: '/fundacion/solicitudes',
      name: user.foundationName || fullName(user),
      role: user.foundationVerified ? foundationRoles.verificada : 'Fundación',
      sections: [
        {
          title: 'Gestión',
          items: [
            { to: '/fundacion/solicitudes', label: 'Solicitudes', icon: 'file' },
            { to: '/fundacion/mascotas', label: 'Mis mascotas', icon: 'paw' },
            { to: '/fundacion/campanas', label: 'Campañas', icon: 'heart' },
          ],
        },
      ],
      searchBase: '/fundacion/mascotas',
      searchLabel: 'Buscar en mis mascotas',
      site: { to: '/adoptar', label: 'Ver sitio' },
      messages: '/fundacion/solicitudes',
      notifications: '/fundacion/solicitudes',
      help: {
        to: '/fundacion/mascotas/nueva',
        script: 'Tip del día',
        title: 'Fotos que enamoran',
        text: 'Las mascotas con buenas fotos se adoptan más rápido',
      },
    }
  }

  function foundationPanel() {
    if (user.source === 'backend') return apiFoundationPanel()
    const foundation = getFoundationById(user.foundationId)
    const foundationRequests = requests.filter((request) => request.foundationId === user.foundationId && request.stage !== 'borrador')
    const newRequests = foundationRequests.filter((request) => request.stage === 'nueva' || request.stage === 'revision')
    const foundationPets = pets.filter((pet) => pet.foundationId === user.foundationId && pet.status !== 'Adoptado')
    const foundationCampaigns = campaigns.filter((campaign) => campaign.foundationId === user.foundationId)
    const nearbyReports = reports.filter((report) => report.notified?.some((item) => item.foundationId === user.foundationId))
    return {
      menuLabel: 'Menú del panel de fundación',
      subtitle: 'Panel de fundación',
      home: '/fundacion',
      name: foundation?.name ?? user.name,
      role: foundationRoles[verificationOf(foundation)],
      sections: [
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
      ],
      searchBase: '/fundacion/mascotas',
      searchLabel: 'Buscar en mis mascotas',
      site: { to: `/fundaciones/${user.foundationId}`, label: 'Ver perfil público' },
      messages: '/fundacion/mensajes',
      notifications: '/fundacion',
      help: {
        to: '/fundacion/mascotas/nueva',
        script: 'Tip del día',
        title: 'Fotos que enamoran',
        text: 'Las mascotas con 4+ fotos se adoptan 2× más rápido',
      },
    }
  }

  function adminPanel() {
    const pendingFoundations = foundations.filter((foundation) => verificationOf(foundation) === 'pendiente').length
    const campaignsInReview = campaigns.filter((campaign) => campaign.status === 'En revisión').length
    const unattendedReports = reports.filter((report) => report.status === 'notificado').length
    const section = pathname.split('/')[2]
    return {
      menuLabel: 'Menú del panel de administración',
      subtitle: 'Administración',
      home: '/admin',
      name: fullName(user),
      role: 'Administrador',
      sections: [
        {
          title: 'General',
          items: [
            { to: '/admin', label: 'Resumen', icon: 'home', end: true },
            { to: '/admin/fundaciones', label: 'Fundaciones', icon: 'building', count: pendingFoundations, alert: true },
            { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
          ],
        },
        {
          title: 'Publicaciones',
          items: [
            { to: '/admin/mascotas', label: 'Mascotas', icon: 'paw' },
            { to: '/admin/campanas', label: 'Campañas', icon: 'heart', count: campaignsInReview, alert: true },
            { to: '/admin/historias', label: 'Historias', icon: 'sparkles' },
          ],
        },
        {
          title: 'Seguimiento',
          items: [
            { to: '/admin/reportes', label: 'Reportes', icon: 'zap', count: unattendedReports, alert: true },
            { to: '/admin/donaciones', label: 'Donaciones', icon: 'star' },
            { to: '/admin/estadisticas', label: 'Estadísticas', icon: 'trending-up' },
          ],
        },
      ],
      // El buscador filtra la sección abierta; desde el resumen busca fundaciones.
      searchBase: adminSearchable.includes(section) ? `/admin/${section}` : '/admin/fundaciones',
      searchLabel: 'Buscar en esta sección',
      site: { to: '/', label: 'Ver sitio' },
      messages: null,
      notifications: '/admin',
      help: {
        to: '/admin/fundaciones?estado=pendiente',
        script: 'Antes de aprobar',
        title: 'Revisa los documentos',
        text: 'Confirma que el NIT del RUT coincida con el registro',
      },
    }
  }

  function handleSearch(event) {
    event.preventDefault()
    const text = query.trim()
    navigate(text ? `${panel.searchBase}?q=${encodeURIComponent(text)}` : panel.searchBase)
    setQuery('')
  }

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`} aria-label={panel.menuLabel}>
        <div className={styles.sidebarTop}>
          <Logo subtitle={panel.subtitle} to={panel.home} />
          <button type="button" className={`icon-btn ${styles.closeButton}`} onClick={() => setOpen(false)} aria-label="Cerrar menú">
            <Icon name="x" />
          </button>
        </div>

        <div className={styles.userCard}>
          <Avatar name={panel.name} src={user.avatar} color="primary" size="md" />
          <div>
            <strong>{panel.name}</strong>
            <span>{panel.role}</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {panel.sections.map((section) => (
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

        <Link to={panel.help.to} className={styles.helpCard}>
          <span className="script">{panel.help.script}</span>
          <strong>{panel.help.title}</strong>
          <small>{panel.help.text}</small>
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
              aria-label={panel.searchLabel}
            />
            <kbd className="kbd">Ctrl K</kbd>
          </form>

          <div className={styles.topActions}>
            <Link className={`btn btn-soft ${styles.siteButton}`} to={panel.site.to}>
              <Icon name="home" />
              <span>{panel.site.label}</span>
            </Link>
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            {panel.messages && (
              <Link className="icon-btn" to={panel.messages} aria-label="Mensajes">
                <Icon name="message" />
              </Link>
            )}
            <Link className={`icon-btn ${styles.bell}`} to={panel.notifications} aria-label="Notificaciones">
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
