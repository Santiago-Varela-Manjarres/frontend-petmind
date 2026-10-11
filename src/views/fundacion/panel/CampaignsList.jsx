import { Link } from 'react-router-dom'
import { StatusPill } from '../../../components/ui/Badges'
import { useCampaigns } from '../../../context/CampaignsContext'
import { campaignGoal } from '../../../data/campaigns'
import { formatDate } from '../../../utils/dates'
import { formatCOP } from '../../../utils/format'
import Empty from './Empty'
import { statusTone } from './panelData'
import styles from '../Fundacion.module.css'

// Tabla "Mis campañas" con progreso de recaudo y acciones.
export default function CampaignsList({ ownCampaigns }) {
  const { deleteCampaign } = useCampaigns()

  return (
    <section className={styles.card}>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Categoría</th>
              <th>Recaudado / meta</th>
              <th>Cierre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ownCampaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>
                  <div className={styles.petCell}>
                    <img src={campaign.photo || undefined} alt="" />
                    <strong>{campaign.title}</strong>
                  </div>
                </td>
                <td>{campaign.category}</td>
                <td>
                  <strong>{formatCOP(campaign.raised)}</strong>
                  <small> de {formatCOP(campaignGoal(campaign))}</small>
                  <div className={styles.progress}>
                    <span
                      style={{
                        width: `${Math.min(100, campaignGoal(campaign) ? (campaign.raised / campaignGoal(campaign)) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </td>
                <td>{campaign.endDate ? formatDate(campaign.endDate) : '—'}</td>
                <td>
                  <StatusPill tone={statusTone[campaign.status] || 'neutral'}>{campaign.status}</StatusPill>
                </td>
                <td>
                  <div className={styles.actionRow}>
                    <Link className="btn btn-ghost btn-sm" to={`/donar/${campaign.id}`}>
                      Ver
                    </Link>
                    <Link className="btn btn-secondary btn-sm" to={`/fundacion/campanas/${campaign.id}/editar`}>
                      Editar
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar “${campaign.title}”?`)) deleteCampaign(campaign.id)
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!ownCampaigns.length && <Empty text="Crea tu primera campaña para recibir donaciones." />}
      </div>
    </section>
  )
}
