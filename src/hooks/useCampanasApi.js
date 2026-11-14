import { useEffect } from 'react'
import { useCampaigns } from '../context/CampaignsContext'

// Campañas que las fundaciones publicaron en el backend. La primera pantalla que las usa dispara la consulta;
// las demás reutilizan lo que ya trajo CampaignsProvider. status: loading · success · error (idle si enabled = false).
export function useCampanasApi(enabled = true) {
  const { apiCampaigns, apiCampaignsStatus, loadApiCampaigns } = useCampaigns()

  useEffect(() => {
    if (enabled) loadApiCampaigns()
  }, [enabled, loadApiCampaigns])

  let status = apiCampaignsStatus
  if (status === 'idle') status = enabled ? 'loading' : 'idle'
  return {
    campaigns: apiCampaigns,
    status,
    reload: () => loadApiCampaigns({ force: true }),
  }
}
