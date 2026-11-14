import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { useAdminLog } from '../../context/AdminLogContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { fullName } from '../../data/users'
import { useFundacionesApi } from '../../hooks/useFundacionesApi'
import { avisoMascotaGuardada } from '../fundacion/api/avisos'
import MascotaEditorApi from '../fundacion/api/MascotaEditorApi'
import { EstadoLista } from '../fundacion/api/TablaApiPartes'
import { AdminHeader } from './AdminParts'
import styles from './Admin.module.css'

// Panel de administración · Agregar una mascota en nombre de una fundación del backend, o corregir una
// que ya está publicada (soporte). Usa el mismo formulario del panel de la fundación, con la fundación a elegir.
export default function MascotaApiAdmin() {
  const { petId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { record } = useAdminLog()
  const { showToast } = useToast()
  const fundaciones = useFundacionesApi()

  function alGuardar(mascota, { nueva, fotosGuardadas }) {
    const fundacion = fundaciones.porId(mascota.fundacionId)?.nombre ?? `la fundación #${mascota.fundacionId}`
    record({
      by: fullName(user),
      action: nueva ? `Agregó una mascota de ${fundacion}` : `Editó la mascota de ${fundacion}`,
      tone: 'success',
      target: { type: 'mascota', id: String(mascota.id), name: mascota.nombre },
    })
    navigate('/admin/mascotas')
    const mensaje = nueva ? `Agregamos a ${mascota.nombre} en ${fundacion}.` : `Guardamos los cambios de ${mascota.nombre}.`
    showToast(...avisoMascotaGuardada(mensaje, { fotosGuardadas }))
  }

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/admin/mascotas">
        <Icon name="arrow-left" /> Volver a Mascotas
      </Link>
      <AdminHeader
        eyebrow="Publicaciones · servidor"
        title={petId ? 'Editar mascota' : 'Agregar mascota'}
        text="Se guarda en el servidor a nombre de la fundación que elijas. Si queda publicada y disponible, aparece en Adoptar."
      />
      {fundaciones.status === 'success' ? (
        <MascotaEditorApi petId={petId ?? null} fundaciones={fundaciones.fundaciones} backTo="/admin/mascotas" onSaved={alGuardar} />
      ) : (
        <EstadoLista status={fundaciones.status} recurso="fundaciones" onRetry={fundaciones.retry} />
      )}
    </div>
  )
}
