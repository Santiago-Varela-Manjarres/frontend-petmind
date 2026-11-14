import { Link } from 'react-router-dom'
import { SelectInput } from '../../../components/forms/Field'
import Icon from '../../../components/ui/Icon'
import { Pagination } from '../../../components/ui/Navigation'
import styles from './PanelApi.module.css'

// Piezas que comparten las tablas de mascotas y campañas del servidor.

// "Cargando…" o el error con "Reintentar" mientras la lista no está lista. recurso: "mascotas", "campañas"…
export function EstadoLista({ status, recurso, onRetry }) {
  if (status === 'error') {
    return (
      <div className="alert alert-error" role="alert">
        <Icon name="alert-circle" /> No pudimos cargar las {recurso} del servidor.
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    )
  }
  return (
    <p className={styles.status} role="status">
      Cargando {recurso}…
    </p>
  )
}

// Buscador y, si llegan opciones, el filtro por fundación (panel de administración).
export function BarraFiltros({ query, onQuery, placeholder, label, opcionesFundacion = null, fundacion, onFundacion }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.search}>
        <Icon name="search" />
        <input
          className="input"
          type="search"
          value={query}
          placeholder={placeholder}
          aria-label={label}
          onChange={(event) => onQuery(event.target.value)}
        />
      </div>
      {opcionesFundacion && (
        <SelectInput icon="building" aria-label="Filtrar por fundación" value={fundacion} onChange={(event) => onFundacion(event.target.value)}>
          <option value="">Todas las fundaciones</option>
          {opcionesFundacion.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </SelectInput>
      )}
    </div>
  )
}

// Sin filas: con datos, invita a cambiar los filtros; sin datos, ofrece crear el primero.
export function SinFilas({ icon, hayDatos, sinDatos, sinCoincidencias, ayuda, newPath, accion }) {
  return (
    <div className={styles.empty}>
      <Icon name={icon} />
      <strong>{hayDatos ? sinCoincidencias : sinDatos}</strong>
      {hayDatos ? (
        <p>{ayuda}</p>
      ) : (
        newPath && (
          <Link className="btn btn-primary btn-sm" to={newPath}>
            <Icon name="plus" /> {accion}
          </Link>
        )
      )}
    </div>
  )
}

// "Mostrando 1–8 de 20" y la paginación (recibe lo que devuelve paginate()).
export function PieTabla({ from, to, total, page, totalPages, onPage }) {
  return (
    <div className={styles.footer}>
      <span>
        Mostrando {from}–{to} de {total}
      </span>
      <Pagination page={page} totalPages={totalPages} onChange={onPage} />
    </div>
  )
}
