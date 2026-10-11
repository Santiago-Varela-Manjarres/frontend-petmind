import { DonationsContext } from './DonationsContext'
import { initialDonations } from '../data/donations'
import { usePersistentState } from '../hooks/usePersistentState'

// Referencia aleatoria tipo "DON-48213". Se repite el sorteo si ya existe, porque la referencia
// es el id con el que se abre el comprobante (/donar/gracias/:id).
function newReference(donations) {
  let id
  do {
    id = `DON-${Math.floor(10000 + Math.random() * 89999)}`
  } while (donations.some((donation) => donation.id === id))
  return id
}

export function DonationsProvider({ children }) {
  const [donations, setDonations] = usePersistentState('donations', initialDonations)

  function getDonationById(id) {
    return donations.find((donation) => donation.id === id)
  }

  function addDonation(data) {
    const donation = {
      status: 'aprobada',
      ...data,
      id: newReference(donations),
      date: new Date().toISOString(),
    }
    if (donation.frequency === 'mensual' && donation.status === 'aprobada') donation.subscription = 'activa'
    setDonations((prev) => [donation, ...prev])
    return donation
  }

  function updateDonation(id, changes) {
    setDonations((prev) => prev.map((donation) => (donation.id === id ? { ...donation, ...changes } : donation)))
  }

  const value = { donations, getDonationById, addDonation, updateDonation }

  return <DonationsContext.Provider value={value}>{children}</DonationsContext.Provider>
}
