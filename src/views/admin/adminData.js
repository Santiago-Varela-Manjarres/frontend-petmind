import { useSearchParams } from 'react-router-dom'

// Etiquetas, rutas y utilidades compartidas por las pantallas del panel de administración.

export const PAGE_SIZE = 8

// A dónde lleva cada entrada de la bitácora y con qué ícono se muestra.
export const targetInfo = {
  fundacion: { icon: 'building', label: 'Fundación', path: (target) => `/admin/fundaciones/${target.id}` },
  mascota: { icon: 'paw', label: 'Mascota', path: (target) => `/admin/mascotas?q=${encodeURIComponent(target.name)}` },
  campana: { icon: 'heart', label: 'Campaña', path: (target) => `/admin/campanas?q=${encodeURIComponent(target.name)}` },
  historia: { icon: 'sparkles', label: 'Historia', path: (target) => `/admin/historias?q=${encodeURIComponent(target.name)}` },
  reporte: { icon: 'zap', label: 'Reporte', path: (target) => `/admin/reportes?q=${encodeURIComponent(target.id)}&estado=todos` },
  usuario: { icon: 'user', label: 'Usuario', path: (target) => `/admin/usuarios?q=${encodeURIComponent(target.name)}` },
}

// Búsqueda sin tildes ni mayúsculas: "medellin" encuentra "Medellín".
export function normalizeText(value = '') {
  return String(value)
    .toLocaleLowerCase('es-CO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function matchesQuery(query, ...fields) {
  const term = normalizeText(query.trim())
  if (!term) return true
  return fields.some((field) => normalizeText(field ?? '').includes(term))
}

// Corta la lista en páginas. Si la página pedida quedó fuera de rango (por un filtro), se usa la última.
export function paginate(rows, requestedPage, size = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(rows.length / size))
  const page = Math.min(requestedPage, totalPages)
  const start = (page - 1) * size
  return {
    page,
    totalPages,
    pageRows: rows.slice(start, start + size),
    from: rows.length ? start + 1 : 0,
    to: Math.min(start + size, rows.length),
  }
}

// Filtros de las tablas guardados en la URL (?q=, ?estado=, ?pagina= y los que agregue cada pantalla),
// para que el buscador de la barra superior y los enlaces del resumen abran la tabla ya filtrada.
export function useListParams(defaultFilter = 'todas') {
  const [params, setParams] = useSearchParams()

  function update(changes) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(changes).forEach(([key, value]) => {
          const isDefault =
            value === '' || value == null || (key === 'estado' && value === defaultFilter) || (key === 'pagina' && value === 1)
          if (isDefault) next.delete(key)
          else next.set(key, String(value))
        })
        return next
      },
      { replace: true },
    )
  }

  return {
    query: params.get('q') ?? '',
    filter: params.get('estado') ?? defaultFilter,
    page: Math.max(1, Number(params.get('pagina')) || 1),
    get: (key) => params.get(key) ?? '',
    setQuery: (value) => update({ q: value, pagina: 1 }),
    setFilter: (value) => update({ estado: value, pagina: 1 }),
    setPage: (value) => update({ pagina: value }),
    set: (key, value) => update({ [key]: value, pagina: 1 }),
  }
}
