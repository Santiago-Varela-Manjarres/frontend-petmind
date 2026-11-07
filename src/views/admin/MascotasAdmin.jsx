import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SelectInput } from '../../components/forms/Field'
import { SexBadge, StatusPill } from '../../components/ui/Badges'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Icon from '../../components/ui/Icon'
import { Tabs } from '../../components/ui/Navigation'
import { useFoundations } from '../../context/FoundationsContext'
import { usePets } from '../../context/PetsContext'
import { isAdoptable, species } from '../../data/pets'
import { formatAge, formatDate } from '../../utils/dates'
import { isHidden } from '../../utils/moderation'
import { statusTone } from '../fundacion/panel/panelData'
import { AdminHeader, EmptyRows, HiddenPill, SearchField, TableFooter } from './AdminParts'
import { matchesQuery, paginate, useListParams } from './adminData'
import { useModeration } from './useModeration'
import styles from './Admin.module.css'

const tabs = [
  { value: 'todas', label: 'Todas', test: () => true },
  { value: 'en-adopcion', label: 'En adopción', test: isAdoptable },
  { value: 'adoptadas', label: 'Adoptadas', test: (pet) => pet.status === 'Adoptado' && !isHidden(pet) },
  { value: 'sin-publicar', label: 'Sin publicar', test: (pet) => ['Borrador', 'Pausado'].includes(pet.status) && !isHidden(pet) },
  { value: 'retiradas', label: 'Retiradas', test: isHidden },
]

// Qué ve el público de cada publicación.
function Visibility({ pet }) {
  if (isHidden(pet)) return <HiddenPill moderation={pet.moderation} />
  if (isAdoptable(pet)) return <StatusPill tone="success" size="sm">Visible</StatusPill>
  if (pet.status === 'Adoptado') return <StatusPill tone="info" size="sm">Visible · adoptada</StatusPill>
  return <StatusPill tone="neutral" size="sm">Sin publicar</StatusPill>
}

// Panel de administración · Publicaciones de mascotas: retirar del sitio o restaurar.
export default function MascotasAdmin() {
  const { pets } = usePets()
  const { foundations, getFoundationById } = useFoundations()
  const moderation = useModeration()
  const list = useListParams('todas')
  const [dialog, setDialog] = useState(null)
  const foundationFilter = list.get('fundacion')
  const speciesFilter = list.get('especie')
  const tab = tabs.find((item) => item.value === list.filter) ?? tabs[0]

  const rows = pets
    .filter(
      (pet) =>
        tab.test(pet) &&
        (!foundationFilter || pet.foundationId === foundationFilter) &&
        (!speciesFilter || pet.species === speciesFilter) &&
        matchesQuery(list.query, pet.name, pet.city, getFoundationById(pet.foundationId)?.name),
    )
    .sort((a, b) => Number(isHidden(b)) - Number(isHidden(a)) || new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
  const { page, totalPages, pageRows, from, to } = paginate(rows, list.page)
  const withPets = foundations.filter((foundation) => pets.some((pet) => pet.foundationId === foundation.id))

  function askHide(pet) {
    setDialog({
      icon: 'eye-off',
      tone: 'danger',
      title: `Retirar la publicación de ${pet.name}`,
      text: 'Deja de verse en el sitio y nadie puede enviar solicitudes. La fundación verá el motivo en su panel; las solicitudes que ya tenía se conservan.',
      reasonLabel: 'Motivo del retiro',
      reasonPlaceholder: 'Ej.: Las fotos no corresponden a la mascota. Sube fotos reales para volver a publicarla.',
      confirmLabel: 'Retirar publicación',
      onConfirm: ({ reason }) => moderation.hidePet(pet, reason),
    })
  }

  return (
    <div className={styles.page}>
      <AdminHeader
        eyebrow="Publicaciones"
        title="Mascotas"
        text="Todas las mascotas publicadas por las fundaciones. Retira las que no cumplan las normas de PetMind: dejan de verse sin que la fundación pierda su información."
      />

      <section className={styles.card}>
        <Tabs
          label="Filtrar mascotas"
          variant="pills"
          value={tab.value}
          onChange={list.setFilter}
          tabs={tabs.map(({ value, label, test }) => ({ value, label, count: pets.filter(test).length }))}
        />
        <div className={styles.toolbar}>
          <SearchField value={list.query} onChange={list.setQuery} placeholder="Buscar por nombre, ciudad o fundación" />
          <SelectInput
            icon="building"
            aria-label="Filtrar por fundación"
            value={foundationFilter}
            onChange={(event) => list.set('fundacion', event.target.value)}
          >
            <option value="">Todas las fundaciones</option>
            {withPets.map((foundation) => (
              <option key={foundation.id} value={foundation.id}>
                {foundation.name}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            icon="paw"
            aria-label="Filtrar por especie"
            value={speciesFilter}
            onChange={(event) => list.set('especie', event.target.value)}
          >
            <option value="">Todas las especies</option>
            {species.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </SelectInput>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Fundación</th>
                <th>Estado</th>
                <th>En el sitio</th>
                <th>Publicada</th>
                <th className={styles.alignEnd}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((pet) => {
                const foundation = getFoundationById(pet.foundationId)
                const hidden = isHidden(pet)
                return (
                  <tr key={pet.id}>
                    <td>
                      <div className={styles.cell}>
                        <img src={pet.photo || undefined} alt="" />
                        <span className={styles.cellText}>
                          <strong>{pet.name}</strong>
                          <small>
                            <SexBadge sex={pet.sex} size="sm" /> {pet.species} · {formatAge(pet.ageMonths)} · {pet.city}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>
                      {foundation ? (
                        <Link to={`/admin/fundaciones/${foundation.id}`}>{foundation.name}</Link>
                      ) : (
                        <span className={styles.subtle}>Sin fundación</span>
                      )}
                    </td>
                    <td>
                      <StatusPill tone={statusTone[pet.status] || 'neutral'} size="sm">
                        {pet.status}
                      </StatusPill>
                    </td>
                    <td>
                      <span className={styles.stack}>
                        <Visibility pet={pet} />
                        {hidden && pet.moderation?.reason && <small className={styles.subtle}>{pet.moderation.reason}</small>}
                      </span>
                    </td>
                    <td>{pet.createdAt ? formatDate(pet.createdAt, { year: true }) : '—'}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link className="icon-btn" to={`/adoptar/${pet.id}`} aria-label={`Ver el perfil público de ${pet.name}`} title="Ver perfil">
                          <Icon name="eye" />
                        </Link>
                        {hidden ? (
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => moderation.restorePet(pet)}>
                            Restaurar
                          </button>
                        ) : (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => askHide(pet)}>
                            Retirar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!pageRows.length && <EmptyRows text="Prueba con otro nombre o quita algún filtro." />}
        </div>
        <TableFooter from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={list.setPage} />
      </section>

      <ConfirmDialog {...dialog} open={Boolean(dialog)} onClose={() => setDialog(null)} />
    </div>
  )
}
