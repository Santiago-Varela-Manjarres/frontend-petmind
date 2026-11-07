// Íconos SVG propios (trazo de 24 × 24, estilo Lucide) para no instalar librerías.
// Uso: <Icon name="heart" /> · el color sale de `currentColor`.
const paths = {
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v5" />
      <path d="M12 16.2h.01" />
    </>
  ),
  'alert-triangle': (
    <>
      <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  building: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V9.5L12 4l7 5.5V21" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
      <path d="M16 2.5v4" />
      <path d="M8 2.5v4" />
      <path d="M3 10h18" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4h-5L7.5 6.5H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m8.5 12.2 2.4 2.4 4.8-5" />
    </>
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'chevron-up': <path d="m18 15-6-6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />
    </>
  ),
  'credit-card': (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  edit: (
    <>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
      <path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </>
  ),
  file: (
    <>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z" />
      <path d="M14 2v6h6" />
    </>
  ),
  'file-check': (
    <>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z" />
      <path d="M14 2v6h6" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  filter: (
    <>
      <path d="M3 6h18" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  heart: (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M9.5 22v-7h5v7" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 16v-4.5" />
      <path d="M12 8h.01" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 9.8-9.8" />
      <path d="m16 7 3 3" />
      <path d="m18.5 4.5 2 2" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10.5" rx="2.5" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </>
  ),
  'log-out': (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m22 7.5-8.97 5.6a2 2 0 0 1-2.06 0L2 7.5" />
    </>
  ),
  'map-pin': (
    <>
      <path d="M19.5 10c0 5.5-7.5 12-7.5 12S4.5 15.5 4.5 10a7.5 7.5 0 0 1 15 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  message: <path d="M7.9 20A9 9 0 1 0 4 16.1L2.5 21.5Z" />,
  minus: <path d="M5 12h14" />,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.1" />
      <circle cx="12" cy="12" r="1.1" />
      <circle cx="19" cy="12" r="1.1" />
    </>
  ),
  paw: (
    <>
      <path d="M12 21.5c-3.6 0-6-1.9-6-4.3 0-2.9 3.1-5.7 6-5.7s6 2.8 6 5.7c0 2.4-2.4 4.3-6 4.3Z" />
      <ellipse cx="4.6" cy="10.4" rx="1.9" ry="2.4" transform="rotate(-18 4.6 10.4)" />
      <ellipse cx="8.8" cy="5.6" rx="1.9" ry="2.5" transform="rotate(-6 8.8 5.6)" />
      <ellipse cx="15.2" cy="5.6" rx="1.9" ry="2.5" transform="rotate(6 15.2 5.6)" />
      <ellipse cx="19.4" cy="10.4" rx="1.9" ry="2.4" transform="rotate(18 19.4 10.4)" />
    </>
  ),
  phone: (
    <path d="M21.5 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.6 3.7 2 2 0 0 1 3.6 1.5h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L7.6 9.4a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7a2 2 0 0 1 1.71 2.02Z" />
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  receipt: (
    <>
      <path d="M5 2.5h14v19l-3-2-2 2-2-2-2 2-2-2-3 2Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
    </>
  ),
  'refresh-cw': (
    <>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M8 16H3v5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7.5" />
      <path d="m21 21-4.35-4.35" />
    </>
  ),
  send: (
    <>
      <path d="M21.5 2.5 14.6 21.3a.5.5 0 0 1-.93.03L10.5 13.5 2.66 10.32a.5.5 0 0 1 .03-.93Z" />
      <path d="M21.5 2.5 10.5 13.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.8" />
      <circle cx="6" cy="12" r="2.8" />
      <circle cx="18" cy="19" r="2.8" />
      <path d="m8.5 13.5 7 4" />
      <path d="m15.5 6.5-7 4" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  'shield-check': (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.7 8.3 18.5 10l-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7Z" />
      <path d="M19 15.5 19.8 17.7 22 18.5l-2.2.8L19 21.5l-.8-2.2-2.2-.8 2.2-.8Z" />
    </>
  ),
  star: (
    <path d="m12 2.5 2.95 6 6.55.95-4.75 4.62 1.12 6.53L12 17.5l-5.87 3.1 1.12-6.53L2.5 9.45l6.55-.95Z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  syringe: (
    <>
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
      <path d="m14 4 6 6" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  'trending-up': (
    <>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  video: (
    <>
      <path d="m22 8-6 4 6 4Z" />
      <rect x="2" y="6" width="14" height="12" rx="2.5" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9Z" />,
  // Símbolos de sexo de la mascota
  female: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v8" />
      <path d="M8.5 18.5h7" />
    </>
  ),
  male: (
    <>
      <circle cx="10" cy="14" r="5.5" />
      <path d="m14 10 6.5-6.5" />
      <path d="M15 3.5h5.5V9" />
    </>
  ),
}

// Íconos que van rellenos en vez de con trazo.
const filled = {
  'heart-filled': paths.heart,
  'star-filled': paths.star,
  play: <path d="M7 4.5v15a.8.8 0 0 0 1.2.7l12.2-7.5a.8.8 0 0 0 0-1.4L8.2 3.8a.8.8 0 0 0-1.2.7Z" />,
}

// Nombres de Lucide que ya usa el código para un ícono que aquí se llama distinto.
const aliases = { 'more-horizontal': 'more' }

// El tamaño por defecto es 1em (el del texto); cualquier width/height en CSS lo reemplaza.
export default function Icon({ name: requestedName, size = '1em', strokeWidth = 1.8, className, title, ...props }) {
  const name = aliases[requestedName] ?? requestedName
  const isFilled = name in filled
  const content = isFilled ? filled[name] : paths[name]

  if (!content) return null

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke={isFilled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {title && <title>{title}</title>}
      {content}
    </svg>
  )
}
