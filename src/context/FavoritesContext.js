import { createRequiredContext } from './createRequiredContext'

export const [FavoritesContext, useFavorites] = createRequiredContext('useFavorites', 'FavoritesProvider')
