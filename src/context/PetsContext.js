import { createRequiredContext } from './createRequiredContext'

export const [PetsContext, usePets] = createRequiredContext('usePets', 'PetsProvider')
