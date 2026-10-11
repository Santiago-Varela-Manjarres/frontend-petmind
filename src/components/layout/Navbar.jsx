import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../ui/Logo'
import Icon from '../ui/Icon'
import Avatar from '../ui/Avatar'
import { Dropdown, DropdownItem } from '../ui/Navigation'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useLogout'
import { useFoundations } from '../../context/FoundationsContext'
import styles from './Navbar.module.css'

// Menú principal del mapa general: Adoptar · Donar · Fundaciones · Historias · Nosotros · Contacto.
// `match` agrega rutas que también marcan la opción como activa (p. ej. el seguimiento de una solicitud).
const links = [
  { to: '/adoptar', label: 'Adoptar', match: ['/adoptar', '/cuenta/solicitudes/'] },
  { to: '/donar', label: 'Donar', match: ['/donar'] },
  { to: '/fundaciones', label: 'Fundaciones', match: ['/fundaciones'] },
  { to: '/historias', label: 'Historias', match: ['/historias'] },
  { to: '/nosotros', label: 'Nosotros', match: ['/nosotros'] },
  { to: '/contacto', label: 'Contacto', match: ['/contacto'] },
]

function isActive(pathname, link) {
  return link.match.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`))
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, isFoundation } = useAuth()
  const handleLogout = useLogout()
  const { getFoundationById } = useFoundations()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  // Cerrar el menú del celular al cambiar de página.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMenuOpen(false)
    setSearchOpen(false)
  }

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const foundation = isFoundation ? getFoundationById(user.foundationId) : null
  const panelUrl = isFoundation ? '/fundacion' : '/cuenta'
  const displayName = isFoundation ? (foundation?.name ?? user.name).split(' ')[0] : user?.name

  function handleSearch(event) {
    event.preventDefault()
    const text = query.trim()
    navigate(text ? `/adoptar?q=${encodeURIComponent(text)}` : '/adoptar')
    setQuery('')
    setSearchOpen(false)
  }

  return (
    <header className={styles.header}>
      <nav className={`container ${styles.navbar}`} aria-label="Principal">
        <Logo className={styles.logo} />

        <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={`${styles.link} ${isActive(pathname, link) ? styles.linkActive : ''}`}>
              {link.label}
            </NavLink>
          ))}
          {!user && (
            <Link className={`btn btn-outline ${styles.mobileLogin}`} to="/login">
              Iniciar sesión
            </Link>
          )}
        </div>

        <div className={styles.actions}>
          <div className={styles.search}>
            <button
              type="button"
              className={`icon-btn icon-btn-plain ${styles.action}`}
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-expanded={searchOpen}
              aria-label="Buscar mascotas"
            >
              <Icon name={searchOpen ? 'x' : 'search'} />
            </button>
            {searchOpen && (
              <form className={styles.searchBox} onSubmit={handleSearch} role="search">
                <Icon name="search" />
                <input
                  ref={searchRef}
                  className={styles.searchInput}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Busca por nombre: Luna, Max…"
                  aria-label="Buscar mascotas por nombre"
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Buscar
                </button>
              </form>
            )}
          </div>

          <button
            type="button"
            className={`icon-btn icon-btn-plain ${styles.action}`}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>

          {user ? (
            <>
              {!isFoundation && (
                <Link className={`icon-btn icon-btn-plain ${styles.action} ${styles.hideSm}`} to="/cuenta/favoritos" aria-label="Mis favoritos">
                  <Icon name="heart" />
                </Link>
              )}
              <Link className={`icon-btn icon-btn-plain ${styles.action} ${styles.bell} ${styles.hideSm}`} to={panelUrl} aria-label="Notificaciones (hay nuevas)">
                <Icon name="bell" />
                <span className={styles.bellDot} />
              </Link>

              <Dropdown
                label="Abrir menú de mi cuenta"
                buttonClassName={styles.userButton}
                trigger={
                  <>
                    <Avatar name={isFoundation ? foundation?.name : `${user.name} ${user.lastName}`} src={user.avatar} color="primary" size="sm" />
                    <span className={styles.userName}>{displayName}</span>
                    <Icon name="chevron-down" className={styles.userChevron} />
                  </>
                }
              >
                {isFoundation ? (
                  <>
                    <DropdownItem icon="home" to="/fundacion">
                      Panel de fundación
                    </DropdownItem>
                    <DropdownItem icon="paw" to="/fundacion/mascotas">
                      Mis mascotas
                    </DropdownItem>
                    <DropdownItem icon="file" to="/fundacion/solicitudes">
                      Solicitudes
                    </DropdownItem>
                    <DropdownItem icon="heart" to="/fundacion/campanas">
                      Campañas
                    </DropdownItem>
                    <DropdownItem icon="user" to={`/fundaciones/${user.foundationId}`}>
                      Perfil público
                    </DropdownItem>
                  </>
                ) : (
                  <>
                    <DropdownItem icon="home" to="/cuenta">
                      Mi cuenta
                    </DropdownItem>
                    <DropdownItem icon="file" to="/cuenta/solicitudes">
                      Mis solicitudes
                    </DropdownItem>
                    <DropdownItem icon="heart" to="/cuenta/favoritos">
                      Favoritos
                    </DropdownItem>
                    <DropdownItem icon="star" to="/cuenta/donaciones">
                      Mis donaciones
                    </DropdownItem>
                    <DropdownItem icon="user" to="/cuenta/perfil">
                      Mi perfil
                    </DropdownItem>
                  </>
                )}
                <DropdownItem icon="log-out" onClick={handleLogout} danger>
                  Cerrar sesión
                </DropdownItem>
              </Dropdown>
            </>
          ) : (
            <Link className={`btn btn-outline ${styles.login}`} to="/login">
              Iniciar sesión
            </Link>
          )}

          <button
            type="button"
            className={`icon-btn ${styles.menuButton}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </nav>
    </header>
  )
}
