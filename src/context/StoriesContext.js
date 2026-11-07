import { createRequiredContext } from './createRequiredContext'

export const [StoriesContext, useStories] = createRequiredContext('useStories', 'StoriesProvider')
