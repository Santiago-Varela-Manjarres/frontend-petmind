import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../../components/ui/Icon'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import { useCampanasApi } from '../../../hooks/useCampanasApi'
import { useFundacionesApi } from '../../../hooks/useFundacionesApi'
import { useMascotasBackend } from '../../../hooks/useMascotasBackend'
import SolicitudesFundacionApi from '../SolicitudesFundacionApi'
import { avisoCampanaPublicada, avisoMascotaGuardada } from './avisos'
import CampanaEditorApi from './CampanaEditorApi'
import CampanasApiTabla from './CampanasApiTabla'
import MascotaEditorApi from './MascotaEditorApi'
import MascotasApiTabla from './MascotasApiTabla'
import panelStyles from '../Fundacion.module.css'
import styles from './PanelApi.module.css'

// Panel de la fundación para las cuentas del backend (representante de una fundación de la API):
// solicitudes de adopción, mascotas y campañas de donación, todo guardado en el servidor.
export default function PanelFundacionApi() {
  const { pathname } = useLocation()
  const section = pathname.split('/')[2]
  if (section === 'mascotas') return <MascotasFundacion />
  if (section === 'campanas') return <CampanasFundacion />
  // Resumen y las demás secciones del panel de demostración llevan a las solicitudes.
  return <SolicitudesFundacionApi />
}

function Encabezado({ title, text, children }) {
  const { user } = useAuth()
  return (
    <header className={panelStyles.heading}>
      <title>{`${title} | PetMind`}</title>
      <div>
        <span className="eyebrow">{user.foundationName || 'Tu fundación'}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {children}
    </header>
  )
}

function SinFundacion() {
  return (
    <div className="alert alert-warning" role="alert">
      <Icon name="alert-triangle" /> Tu cuenta no está vinculada a una fundación en el servidor.
    </div>
  )
}

function MascotasFundacion() {
  const { pathname } = useLocation()
  const { petId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const fundacionId = user.backendFoundationId
  const isNew = pathname.endsWith('/nueva')
  const editing = isNew || Boolean(petId)
  const mascotas = useMascotasBackend({ fundacionId, enabled: !editing && fundacionId != null })
  // Solo para proponer la ciudad de la fundación en una mascota nueva.
  const fundaciones = useFundacionesApi({ enabled: isNew })

  function alGuardar(mascota, { nueva, fotosGuardadas }) {
    mascotas.reload()
    navigate('/fundacion/mascotas')
    const visible = mascota.estadoPublicacion === 'PUBLICADA' && mascota.estadoAdopcion === 'DISPONIBLE'
    const mensaje = !nueva
      ? `Guardamos los cambios de ${mascota.nombre}.`
      : mascota.estadoPublicacion === 'BORRADOR'
        ? `Guardamos el borrador de ${mascota.nombre}.`
        : `¡Publicamos a ${mascota.nombre}!${visible ? ' Ya aparece en Adoptar.' : ''}`
    showToast(...avisoMascotaGuardada(mensaje, { fotosGuardadas }))
  }

  if (editing) {
    return (
      <main className={panelStyles.page}>
        <Encabezado title={isNew ? 'Publicar mascota' : 'Editar mascota'} text="Las mascotas publicadas y disponibles aparecen en Adoptar." />
        {fundacionId == null ? (
          <SinFundacion />
        ) : isNew && fundaciones.status === 'loading' ? (
          <p className={styles.status} role="status">
            Preparando el formulario…
          </p>
        ) : (
          <MascotaEditorApi
            petId={petId ?? null}
            fundacionId={fundacionId}
            ciudadFundacion={fundaciones.porId(fundacionId)?.direccion?.ciudad ?? ''}
            backTo="/fundacion/mascotas"
            onSaved={alGuardar}
          />
        )}
      </main>
    )
  }

  return (
    <main className={panelStyles.page}>
      <Encabezado title="Mis mascotas" text="Publica y edita las mascotas de tu fundación. Las publicadas y disponibles aparecen en Adoptar.">
        <Link className="btn btn-primary" to="/fundacion/mascotas/nueva">
          <Icon name="plus" />
          Publicar mascota
        </Link>
      </Encabezado>
      {fundacionId == null ? (
        <SinFundacion />
      ) : (
        <section className={styles.card}>
          <MascotasApiTabla
            pets={mascotas.pets}
            status={mascotas.status}
            onRetry={mascotas.reload}
            editPath={(pet) => `/fundacion/mascotas/${pet.id}/editar`}
            newPath="/fundacion/mascotas/nueva"
          />
        </section>
      )}
    </main>
  )
}

function CampanasFundacion() {
  const { pathname } = useLocation()
  const { campaignId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const fundacionId = user.backendFoundationId
  const { campaigns, status, reload } = useCampanasApi()
  const propias = campaigns.filter((campaign) => campaign.backendFoundationId === fundacionId)
  const isNew = pathname.endsWith('/nueva')

  // Las campañas del backend no se editan (PUT deja el monto recaudado en cero).
  if (campaignId) return <Navigate to="/fundacion/campanas" replace />

  function alGuardar(campana, resultado) {
    navigate('/fundacion/campanas')
    showToast(...avisoCampanaPublicada(campana, resultado, `¡Publicamos “${campana.titulo}”! Ya aparece en Donar.`))
  }

  if (isNew) {
    return (
      <main className={panelStyles.page}>
        <Encabezado title="Crear campaña" text="Cuéntales a las familias cómo pueden ayudar. La campaña se publica en Donar en cuanto la guardas." />
        {fundacionId == null ? (
          <SinFundacion />
        ) : (
          <CampanaEditorApi fundacionId={fundacionId} nombreFundacion={user.foundationName ?? ''} backTo="/fundacion/campanas" onSaved={alGuardar} />
        )}
      </main>
    )
  }

  return (
    <main className={panelStyles.page}>
      <Encabezado title="Mis campañas" text="Las campañas de donación de tu fundación. Las activas aparecen en Donar hasta su fecha de cierre.">
        <Link className="btn btn-primary" to="/fundacion/campanas/nueva">
          <Icon name="plus" />
          Crear campaña
        </Link>
      </Encabezado>
      {fundacionId == null ? (
        <SinFundacion />
      ) : (
        <section className={styles.card}>
          <CampanasApiTabla campaigns={propias} status={status} onRetry={reload} newPath="/fundacion/campanas/nueva" />
        </section>
      )}
    </main>
  )
}
