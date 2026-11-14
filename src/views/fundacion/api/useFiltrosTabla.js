import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// Estado de las tablas del servidor (mascotas y campañas): búsqueda, pestaña, fundación y página.
// La búsqueda arranca con ?q= de la URL (el buscador de la barra superior del panel) y lo sigue si cambia;
// escribir en la tabla no toca la URL. Cambiar cualquier filtro vuelve a la primera página.
export function useFiltrosTabla(filtroInicial = 'todas') {
  const [params] = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(urlQuery)
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery)
  const [filtro, setFiltro] = useState(filtroInicial)
  const [fundacion, setFundacion] = useState('')
  const [page, setPage] = useState(1)

  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery)
    setQuery(urlQuery)
    setPage(1)
  }

  const desdeLaPrimera = (set) => (value) => {
    set(value)
    setPage(1)
  }

  return {
    query,
    filtro,
    fundacion,
    page,
    setQuery: desdeLaPrimera(setQuery),
    setFiltro: desdeLaPrimera(setFiltro),
    setFundacion: desdeLaPrimera(setFundacion),
    setPage,
  }
}
