import { createRequiredContext } from './createRequiredContext'

export const [DonationsContext, useDonations] = createRequiredContext('useDonations', 'DonationsProvider')
