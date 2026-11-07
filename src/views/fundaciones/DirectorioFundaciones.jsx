import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FoundationCard from '../../components/cards/FoundationCard'
import FoundationMap from '../../components/ui/FoundationMap'
import Icon from '../../components/ui/Icon'
import { Breadcrumbs, Pagination } from '../../components/ui/Navigation'
import { useCampaigns } from '../../context/CampaignsContext'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { isCampaignLive } from '../../data/campaigns'
import { departments } from '../../data/cities'
import { isAdoptable } from '../../data/pets'
import styles from './Fundaciones.module.css'

const cities = ['Todas', 'Medellín', 'Envigado', 'Bello', 'Rionegro', 'Bogotá', 'Cali']

export default function DirectorioFundaciones() {
  const { foundations } = useFoundations()
  const { pets } = usePets()
  const { campaigns } = useCampaigns()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [department, setDepartment] = useState(params.get('departamento') ?? '')
  const [animal, setAnimal] = useState(params.get('animal') ?? '')
  const [city, setCity] = useState(params.get('ciudad') ?? 'Todas')
  const [mode, setMode] = useState('lista')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => foundations.filter((foundation) => {
    const term = query.trim().toLocaleLowerCase('es-CO')
    return foundation.verified &&
      (!term || foundation.name.toLocaleLowerCase('es-CO').includes(term)) &&
      (!department || foundation.department === department) &&
      (!animal || foundation.animals.some((item) => item.toLowerCase().startsWith(animal.toLowerCase()))) &&
      (city === 'Todas' || foundation.city === city)
  }), [foundations, query, department, animal, city])
  const pages = Math.max(1, Math.ceil(filtered.length / 6))
  const pageRows = filtered.slice((page - 1) * 6, page * 6)
  const statsFor = (foundation) => ({
    pets: pets.filter((pet) => pet.foundationId === foundation.id && isAdoptable(pet)).length,
    campaigns: campaigns.filter((campaign) => campaign.foundationId === foundation.id && isCampaignLive(campaign)).length,
    adoptions: foundation.stats.adoptions,
  })

  function applyFilters(event) {
    event.preventDefault()
    const next = {}
    if (query.trim()) next.q = query.trim()
    if (department) next.departamento = department
    if (animal) next.animal = animal
    if (city !== 'Todas') next.ciudad = city
    setParams(next)
    setPage(1)
  }

  return (
    <main className={`page page-tint-blue ${styles.directory}`}>
      <title>Fundaciones | PetMind</title>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Fundaciones' }]} />
        <header className={styles.pageHeading}>
          <h1>Fundaciones que <span className={styles.blue}>hacen la diferencia</span></h1>
          <p>Conoce a las organizaciones verificadas que rescatan, cuidan y buscan hogar para miles de animales en Colombia.</p>
        </header>

        <form className={styles.searchPanel} onSubmit={applyFilters}>
          <label className={`${styles.searchField} input-group`}>
            <Icon name="search" className="input-icon" />
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar fundación por nombre" aria-label="Buscar fundación por nombre" />
          </label>
          <label className="input-group">
            <Icon name="map-pin" className="input-icon" />
            <select className="select" value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Departamento">
              <option value="">Todos los departamentos</option>
              {departments.map((item) => <option key={item}>{item}</option>)}
            </select><Icon name="chevron-down" className="input-chevron" />
          </label>
          <label className="input-group">
            <Icon name="paw" className="input-icon" />
            <select className="select" value={animal} onChange={(event) => setAnimal(event.target.value)} aria-label="Tipo de animal">
              <option value="">Todos los animales</option><option>Perros</option><option>Gatos</option><option>Granja</option>
            </select><Icon name="chevron-down" className="input-chevron" />
          </label>
          <button className="btn btn-primary" type="submit"><Icon name="search" />Buscar</button>
        </form>

        <div className={styles.cityFilters} aria-label="Filtrar por ciudad">
          {cities.map((item) => <button type="button" key={item} className={`chip-option chip-dark ${city === item ? 'active' : ''}`} onClick={() => { setCity(item); setPage(1) }}>{item}</button>)}
        </div>

        <div className={styles.resultsHeading}>
          <p><strong>{filtered.length}</strong> fundaciones verificadas</p>
          <div className={styles.modeSwitch} role="group" aria-label="Tipo de vista">
            <button type="button" className={mode === 'lista' ? styles.selectedMode : ''} onClick={() => setMode('lista')}><Icon name="grid" />Lista</button>
            <button type="button" className={mode === 'mapa' ? styles.selectedMode : ''} onClick={() => setMode('mapa')}><Icon name="map-pin" />Mapa</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><Icon name="search" /><h2>No encontramos fundaciones</h2><p>Prueba con otro nombre, departamento o tipo de animal.</p></div>
        ) : mode === 'mapa' ? (
          <FoundationMap foundations={filtered} large onSelect={() => {}} />
        ) : (
          <div className={styles.directoryGrid}>
            <div className={styles.cardsGrid}>
              {pageRows.map((foundation) => <FoundationCard key={foundation.id} foundation={foundation} stats={statsFor(foundation)} />)}
            </div>
            <aside className={styles.mapAside}>
              <FoundationMap foundations={filtered} />
              <section className={styles.joinCard}>
                <span className="script">¿Tienes una fundación?</span>
                <h2>Únete a PetMind y llega a más familias</h2>
                <p>Publica mascotas, crea campañas y recibe donaciones con total transparencia.</p>
                <Link className="btn btn-white" to="/registro/fundacion">Registrar mi fundación <Icon name="arrow-right" /></Link>
              </section>
            </aside>
          </div>
        )}
        {mode === 'lista' && <Pagination page={page} totalPages={pages} onChange={setPage} />}
      </div>
    </main>
  )
}
