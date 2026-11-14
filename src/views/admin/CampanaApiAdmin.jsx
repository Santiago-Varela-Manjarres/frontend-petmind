import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { useAdminLog } from '../../context/AdminLogContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { fullName } from '../../data/users'
import { useFundacionesApi } from '../../hooks/useFundacionesApi'
import { avisoCampanaPublicada } from '../fundacion/api/avisos'
import CampanaEditorApi from '../fundacion/api/CampanaEditorApi'
import { EstadoLista } from '../fundacion/api/TablaApiPartes'
import { AdminHeader } from './AdminParts'
import styles from './Admin.module.css'

// Panel de administración · Crear una campaña de donación en nombre de una fundación del backend.
// Usa el mismo formulario del panel de la fundación, con la fundación a elegir.
export default function CampanaApiAdmin() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { record } = useAdminLog()
  const { showToast } = useToast()
  const fundaciones = useFundacionesApi()

  function alGuardar(campana, resultado) {
    const fundacion = fundaciones.porId(campana.fundacionId)?.nombre ?? `la fundación #${campana.fundacionId}`
    record({
      by: fullName(user),
      action: `Creó una campaña de ${fundacion}`,
      tone: 'success',
      target: { type: 'campana', id: `api-${campana.id}`, name: campana.titulo },
    })
    navigate('/admin/campanas')
    showToast(...avisoCampanaPublicada(campana, resultado, `Publicamos “${campana.titulo}” de ${fundacion}. Ya aparece en Donar.`))
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/admin/campanas">
        <Icon name="arrow-left" /> Volver a Campañas
      </Link>
      <AdminHeader
        eyebrow="Publicaciones · servidor"
        title="Crear campaña"
        text="Se guarda en el servidor a nombre de la fundación que elijas y aparece en Donar en cuanto la publicas."
      />
      {fundaciones.status === 'success' ? (
        <CampanaEditorApi fundaciones={fundaciones.fundaciones} backTo="/admin/campanas" onSaved={alGuardar} />
      ) : (
        <EstadoLista status={fundaciones.status} recurso="fundaciones" onRetry={fundaciones.retry} />
      )}
    </div>
  )
}
