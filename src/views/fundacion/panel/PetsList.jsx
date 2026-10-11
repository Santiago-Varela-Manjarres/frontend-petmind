import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SelectInput } from '../../../components/forms/Field'
import { SexBadge, StatusPill } from '../../../components/ui/Badges'
import Icon from '../../../components/ui/Icon'
import { Dropdown, DropdownItem, Pagination, Tabs } from '../../../components/ui/Navigation'
import { usePets } from '../../../context/PetsContext'
import { petStatuses, species } from '../../../data/pets'
import { formatAge, formatDate } from '../../../utils/dates'
import { copyToClipboard } from '../../../utils/format'
import Empty from './Empty'
import { statusTone } from './panelData'
import styles from '../Fundacion.module.css'

const PAGE_SIZE = 6

// Pestañas de estado: cada una sabe qué mascotas incluye.
const statusFilters = {
  Todas: () => true,
  Disponibles: (pet) => pet.status === 'Disponible',
  'En proceso': (pet) => ['En proceso', 'Visita agendada'].includes(pet.status),
  Adoptadas: (pet) => pet.status === 'Adoptado',
  Pausadas: (pet) => pet.status === 'Pausado',
}

// Tabla "Mis mascotas" con pestañas por estado, búsqueda, filtro por especie,
// selección múltiple y paginación. La búsqueda se sincroniza con ?q= de la URL.
export default function PetsList({ ownPets, ownRequests, showToast }) {
  const { updatePet, deletePet } = usePets()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const [search, setSearch] = useState(urlQuery)
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery)
  const [petFilter, setPetFilter] = useState('Todas')
  const [speciesFilter, setSpeciesFilter] = useState('Todas')
  const [selectedPets, setSelectedPets] = useState([])
  const [requestedPage, setPage] = useState(1)

  // Si el buscador del menú lateral cambia ?q= estando ya en esta pantalla, se actualiza la búsqueda.
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery)
    setSearch(urlQuery)
    setPage(1)
  }

  const filteredPets = ownPets.filter(
    (pet) =>
      statusFilters[petFilter](pet) &&
      (speciesFilter === 'Todas' || pet.species === speciesFilter) &&
      pet.name.toLowerCase().includes(search.toLowerCase()),
  )
  const totalPages = Math.max(1, Math.ceil(filteredPets.length / PAGE_SIZE))
  // Al eliminar o pausar mascotas la página pedida puede quedar fuera de rango.
  const page = Math.min(requestedPage, totalPages)
  const visiblePets = filteredPets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function changeSearch(value) {
    setSearch(value)
    setPage(1)
    setLastUrlQuery(value)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set('q', value)
      else next.delete('q')
      return next
    })
  }

  function togglePet(id) {
    setSelectedPets((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]))
  }

  function setPetStatus(pet, status) {
    updatePet(pet.id, { status })
    showToast(`Estado de ${pet.name}: ${status}.`)
  }

  return (
    <section className={styles.card}>
      <Tabs
        label="Filtrar mascotas"
        variant="pills"
        value={petFilter}
        onChange={(value) => {
          setPetFilter(value)
          setPage(1)
        }}
        tabs={[
          { value: 'Todas', label: 'Todas', count: ownPets.length },
          {
            value: 'Disponibles',
            label: 'Disponibles',
            count: ownPets.filter((pet) => pet.status === 'Disponible').length,
          },
          {
            value: 'En proceso',
            label: 'En proceso',
            count: ownPets.filter((pet) => ['En proceso', 'Visita agendada'].includes(pet.status)).length,
          },
          {
            value: 'Adoptadas',
            label: 'Adoptadas',
            count: ownPets.filter((pet) => pet.status === 'Adoptado').length,
          },
          {
            value: 'Pausadas',
            label: 'Pausadas',
            count: ownPets.filter((pet) => pet.status === 'Pausado').length,
          },
        ]}
      />
      <div className={styles.toolbar}>
        <input
          className="input"
          placeholder="Buscar por nombre"
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
        />
        <SelectInput
          aria-label="Filtrar por especie"
          value={speciesFilter}
          onChange={(event) => {
            setSpeciesFilter(event.target.value)
            setPage(1)
          }}
        >
          <option value="Todas">Especie · Todas</option>
          {species.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </SelectInput>
        {selectedPets.length > 0 && (
          <div className={styles.toolbar}>
            <span>{selectedPets.length} seleccionadas</span>
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={() => {
                selectedPets.forEach((id) => updatePet(id, { status: 'Pausado' }))
                setSelectedPets([])
                showToast('Pausamos las mascotas seleccionadas.')
              }}
            >
              Pausar
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => {
                if (window.confirm(`¿Eliminar ${selectedPets.length} mascotas?`)) {
                  selectedPets.forEach(deletePet)
                  setSelectedPets([])
                }
              }}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas"
                  checked={visiblePets.length > 0 && visiblePets.every((pet) => selectedPets.includes(pet.id))}
                  onChange={(event) =>
                    setSelectedPets(
                      event.target.checked
                        ? [...new Set([...selectedPets, ...visiblePets.map((pet) => pet.id)])]
                        : selectedPets.filter((id) => !visiblePets.some((pet) => pet.id === id)),
                    )
                  }
                />
              </th>
              <th>Mascota</th>
              <th>Estado</th>
              <th>Solicitudes</th>
              <th>Visitas</th>
              <th>Publicada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visiblePets.map((pet) => {
              const petRequests = ownRequests.filter(
                (request) => request.petId === pet.id && request.stage !== 'borrador',
              )
              const count = petRequests.length
              const visits = petRequests.filter((request) => request.visit).length
              return (
                <tr key={pet.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${pet.name}`}
                      checked={selectedPets.includes(pet.id)}
                      onChange={() => togglePet(pet.id)}
                    />
                  </td>
                  <td>
                    <div className={styles.petCell}>
                      <img src={pet.photo || undefined} alt="" />
                      <span>
                        <strong>{pet.name}</strong>
                        <small>
                          <SexBadge sex={pet.sex} /> {pet.species} · {formatAge(pet.ageMonths)} · {pet.size}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusPill tone={statusTone[pet.status] || 'neutral'}>
                      {pet.status === 'Pausado' ? 'Pausado · en tratamiento' : pet.status}
                    </StatusPill>
                  </td>
                  <td>{count}</td>
                  <td>{visits}</td>
                  <td>{pet.createdAt ? formatDate(pet.createdAt) : '—'}</td>
                  <td>
                    <div className={styles.actionRow}>
                      <Link
                        className="icon-btn"
                        to={`/fundacion/mascotas/${pet.id}/editar`}
                        aria-label={`Editar ${pet.name}`}
                      >
                        <Icon name="edit" />
                      </Link>
                      <button
                        className="icon-btn"
                        type="button"
                        aria-label={`Compartir perfil de ${pet.name}`}
                        onClick={async () => {
                          const result = await copyToClipboard(`${window.location.origin}/adoptar/${pet.id}`)
                          showToast(result ? 'Enlace copiado.' : 'No pudimos copiar el enlace.', {
                            tone: result ? 'success' : 'error',
                          })
                        }}
                      >
                        <Icon name="share" />
                      </button>
                      <Dropdown
                        label={`Más acciones de ${pet.name}`}
                        trigger={<Icon name="more-horizontal" />}
                        buttonClassName="icon-btn"
                      >
                        <DropdownItem to={`/adoptar/${pet.id}`} icon="eye">
                          Ver perfil público
                        </DropdownItem>
                        {petStatuses
                          .filter((status) => status !== pet.status)
                          .map((status) => (
                            <DropdownItem key={status} icon="refresh-cw" onClick={() => setPetStatus(pet, status)}>
                              Cambiar a {status}
                            </DropdownItem>
                          ))}
                        <DropdownItem
                          danger
                          icon="trash"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar a ${pet.name}?`)) deletePet(pet.id)
                          }}
                        >
                          Eliminar
                        </DropdownItem>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visiblePets.length === 0 && <Empty text="Prueba con otro nombre o filtro para encontrar una mascota." />}
      </div>
      <div className={styles.tableFooter}>
        <span>
          Mostrando {filteredPets.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
          {Math.min(page * PAGE_SIZE, filteredPets.length)} de {filteredPets.length}
        </span>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </section>
  )
}
