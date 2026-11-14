// Búsqueda y paginación de las tablas (panel de administración y panel de la fundación).

export const PAGE_SIZE = 8

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
