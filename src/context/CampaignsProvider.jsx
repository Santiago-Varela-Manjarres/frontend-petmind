import { useCallback, useMemo, useRef, useState } from 'react'
import { CampaignsContext } from './CampaignsContext'
import { campaignGoal, fondoPetMind, initialCampaigns } from '../data/campaigns'
import { usePersistentState } from '../hooks/usePersistentState'
import { cargarCampanasDelBackend } from '../services/campanasService'
import { esCampanaApi } from '../services/campanaMapper'
import { slugify } from '../utils/format'

export function CampaignsProvider({ children }) {
  const [campaigns, setCampaigns] = usePersistentState('campaigns', initialCampaigns)
  const [fund, setFund] = usePersistentState('fondo', fondoPetMind)
  // Campañas que las fundaciones crean en el backend (ids "api-<id>"). Se piden la primera vez que una
  // pantalla las necesita (useCampanasApi) y se guardan aquí para no repetir la consulta en cada página.
  const [api, setApi] = useState({ status: 'idle', campaigns: [] })
  const request = useRef(null)
  // Las donaciones del sitio son simuladas: lo donado a una campaña del backend se suma solo en este navegador.
  const [apiDonations, setApiDonations] = usePersistentState('apiCampaignDonations', {})

  // force: volver a consultar (después de crear una campaña). Sin force, se reutiliza la consulta en curso o la última.
  const loadApiCampaigns = useCallback(({ force = false } = {}) => {
    if (request.current && !force) return request.current
    // Reintento después de un error: vuelve a mostrar "Cargando…". Si ya había campañas, se quedan visibles.
    if (force) setApi((prev) => (prev.status === 'error' ? { ...prev, status: 'loading' } : prev))
    // Solo la consulta más reciente cambia el estado: una anterior que llegue tarde no pisa la lista nueva.
    const current = cargarCampanasDelBackend()
      .then((list) => {
        if (request.current === current) setApi({ status: 'success', campaigns: list })
      })
      .catch(() => {
        if (request.current !== current) return
        request.current = null
        setApi((prev) => ({ ...prev, status: prev.campaigns.length ? 'success' : 'error' }))
      })
    request.current = current
    return current
  }, [])

  const apiCampaigns = useMemo(
    () =>
      api.campaigns.map((campaign) => {
        const extra = apiDonations[campaign.id]
        return extra ? { ...campaign, raised: campaign.raised + extra.raised, donors: campaign.donors + extra.donors } : campaign
      }),
    [api.campaigns, apiDonations],
  )

  function getCampaignById(id) {
    if (id === fund.id) return fund
    return campaigns.find((campaign) => campaign.id === id) ?? apiCampaigns.find((campaign) => campaign.id === id)
  }

  // La meta siempre es la suma de los gastos.
  function addCampaign(data) {
    const campaign = {
      raised: 0,
      donors: 0,
      updates: [],
      receipts: [],
      urgent: false,
      status: 'Activa',
      ...data,
      goal: campaignGoal(data),
      id: `${slugify(data.title) || 'campana'}-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    }
    setCampaigns((prev) => [campaign, ...prev])
    return campaign
  }

  function updateCampaign(id, changes) {
    setCampaigns((prev) =>
      prev.map((campaign) => {
        if (campaign.id !== id) return campaign
        const next = { ...campaign, ...changes, updatedAt: new Date().toISOString() }
        return { ...next, goal: campaignGoal(next) }
      }),
    )
  }

  function deleteCampaign(id) {
    setCampaigns((prev) => prev.filter((campaign) => campaign.id !== id))
  }

  // Una donación aprobada suma a lo recaudado y al número de donantes.
  function registerDonation(campaignId, amount) {
    const apply = (campaign) => ({ ...campaign, raised: campaign.raised + amount, donors: campaign.donors + 1 })
    if (campaignId === fund.id) {
      setFund((prev) => apply(prev))
      return
    }
    if (esCampanaApi(campaignId)) {
      setApiDonations((prev) => ({ ...prev, [campaignId]: apply(prev[campaignId] ?? { raised: 0, donors: 0 }) }))
      return
    }
    setCampaigns((prev) => prev.map((campaign) => (campaign.id === campaignId ? apply(campaign) : campaign)))
  }

  const value = {
    campaigns,
    fund,
    getCampaignById,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    registerDonation,
    apiCampaigns,
    apiCampaignsStatus: api.status,
    loadApiCampaigns,
  }

  return <CampaignsContext.Provider value={value}>{children}</CampaignsContext.Provider>
}
