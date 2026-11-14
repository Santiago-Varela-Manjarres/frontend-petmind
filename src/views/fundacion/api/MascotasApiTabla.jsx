import { Link } from 'react-router-dom'
import { SexBadge, StatusPill } from '../../../components/ui/Badges'
import Icon from '../../../components/ui/Icon'
import { Tabs } from '../../../components/ui/Navigation'
import { estadoAdopcionDe, estadoPublicacionDe } from '../../../services/mascotaMapper'
import { apiDate, formatApiDate } from '../../../services/solicitudMapper'
import { formatAge } from '../../../utils/dates'
import { matchesQuery, paginate } from '../../../utils/listas'
import { BarraFiltros, EstadoLista, PieTabla, SinFilas } from './TablaApiPartes'
import { useFiltrosTabla } from './useFiltrosTabla'
import styles from './PanelApi.module.css'

// En Adoptar solo se listan las mascotas publicadas y disponibles.
const visibleEnAdoptar = (pet) => pet.publicationStatus === 'PUBLICADA' && pet.raw.estadoAdopcion === 'DISPONIBLE'

const filtros = [
  { value: 'todas', label: 'Todas', test: () => true },
  { value: 'adopcion', label: 'En adopción', test: (pet) => pet.publicationStatus === 'PUBLICADA' && pet.raw.estadoAdopcion !== 'ADOPTADO' },
  { value: 'borradores', label: 'Borradores', test: (pet) => pet.publicationStatus === 'BORRADOR' },
  { value: 'adoptadas', label: 'Adoptadas', test: (pet) => pet.raw.estadoAdopcion === 'ADOPTADO' },
  { value: 'pausadas', label: 'Pausadas', test: (pet) => ['PAUSADA', 'ARCHIVADA'].includes(pet.publicationStatus) },
]

const masReciente = (a, b) => (apiDate(b.raw.fechaCreacion) ?? 0) - (apiDate(a.raw.fechaCreacion) ?? 0) || b.backendId - a.backendId

function EnElSitio({ pet }) {
  if (visibleEnAdoptar(pet)) {
    return (
      <StatusPill tone="success" size="sm">
        Visible en Adoptar
      </StatusPill>
    )
  }
  const publicacion = estadoPublicacionDe(pet.publicationStatus)
  return (
    <StatusPill tone={pet.publicationStatus === 'PUBLICADA' ? 'info' : publicacion.tone} size="sm">
      {pet.publicationStatus === 'PUBLICADA' ? 'Publicada · no se lista' : publicacion.label}
    </StatusPill>
  )
}

// Tabla de mascotas del backend (mapeadas con `raw`, la respuesta original) con pestañas por estado, búsqueda
// y paginación. fundaciones: si llega, muestra la columna y el filtro por fundación (panel de administración).
export default function MascotasApiTabla({ pets, status, onRetry, editPath, newPath, fundaciones = null }) {
  const filtrosTabla = useFiltrosTabla()
  const { query, fundacion } = filtrosTabla

  if (status !== 'success') return <EstadoLista status={status} recurso="mascotas" onRetry={onRetry} />

  const nombres = new Map((fundaciones ?? []).map((item) => [String(item.id), item.nombre]))
  const nombreFundacion = (id) => nombres.get(id) ?? `Fundación #${id}`
  const actual = filtros.find((item) => item.value === filtrosTabla.filtro) ?? filtros[0]
  const rows = pets
    .filter(
      (pet) =>
        actual.test(pet) &&
        (!fundacion || pet.foundationId === fundacion) &&
        matchesQuery(query, pet.name, pet.city, fundaciones ? nombreFundacion(pet.foundationId) : ''),
    )
    .sort(masReciente)
  const { page, totalPages, pageRows, from, to } = paginate(rows, filtrosTabla.page)
  const opcionesFundacion = fundaciones
    ? fundaciones.filter((item) => pets.some((pet) => pet.foundationId === String(item.id))).map((item) => ({ value: String(item.id), label: item.nombre }))
    : null

  return (
    <>
      <Tabs
        label="Filtrar mascotas"
        variant="pills"
        value={actual.value}
        onChange={filtrosTabla.setFiltro}
        tabs={filtros.map((item) => ({ value: item.value, label: item.label, count: pets.filter(item.test).length }))}
      />
      <BarraFiltros
        query={query}
        onQuery={filtrosTabla.setQuery}
        placeholder={fundaciones ? 'Buscar por nombre, ciudad o fundación' : 'Buscar por nombre o ciudad'}
        label="Buscar mascotas"
        opcionesFundacion={opcionesFundacion}
        fundacion={fundacion}
        onFundacion={filtrosTabla.setFundacion}
      />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mascota</th>
              {fundaciones && <th>Fundación</th>}
              <th>Adopción</th>
              <th>En el sitio</th>
              <th>Publicada</th>
              <th className={styles.alignEnd}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((pet) => {
              const adopcion = estadoAdopcionDe(pet.raw.estadoAdopcion)
              return (
                <tr key={pet.id}>
                  <td>
                    <div className={styles.cell}>
                      {pet.photo ? (
                        <img src={pet.photo} alt="" />
                      ) : (
                        <span className={styles.noPhoto}>
                          <Icon name="paw" />
                        </span>
                      )}
                      <span className={styles.cellText}>
                        <strong>{pet.name}</strong>
                        <small>
                          {pet.sex && <SexBadge sex={pet.sex} size="sm" />}
                          {[pet.speciesLabel, pet.ageMonths == null ? null : formatAge(pet.ageMonths), pet.city].filter(Boolean).join(' · ')}
                        </small>
                      </span>
                    </div>
                  </td>
                  {fundaciones && <td>{nombreFundacion(pet.foundationId)}</td>}
                  <td>
                    <StatusPill tone={adopcion.tone} size="sm">
                      {adopcion.label}
                    </StatusPill>
                  </td>
                  <td>
                    <EnElSitio pet={pet} />
                  </td>
                  <td className={styles.nowrap}>{pet.raw.fechaPublicacion ? formatApiDate(pet.raw.fechaPublicacion) : '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      {visibleEnAdoptar(pet) && (
                        <Link className="icon-btn" to={`/adoptar/backend/${pet.id}`} aria-label={`Ver el perfil público de ${pet.name}`} title="Ver en Adoptar">
                          <Icon name="eye" />
                        </Link>
                      )}
                      <Link className="icon-btn" to={editPath(pet)} aria-label={`Editar a ${pet.name}`} title="Editar">
                        <Icon name="edit" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!pageRows.length && (
          <SinFilas
            icon="paw"
            hayDatos={pets.length > 0}
            sinDatos="Todavía no hay mascotas publicadas"
            sinCoincidencias="No hay mascotas con estos filtros"
            ayuda="Prueba con otro nombre o quita algún filtro."
            newPath={newPath}
            accion="Publicar la primera mascota"
          />
        )}
      </div>
      <PieTabla from={from} to={to} total={rows.length} page={page} totalPages={totalPages} onPage={filtrosTabla.setPage} />
    </>
  )
}
