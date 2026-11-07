import { useMemo } from 'react'
import { StoriesContext } from './StoriesContext'
import { stories as initialStories } from '../data/stories'
import { usePersistentState } from '../hooks/usePersistentState'
import { isHidden } from '../utils/moderation'

// Las historias son contenido fijo de data/stories.js; lo único que cambia es la moderación del
// panel de administración. Se guarda aparte ({ [id]: registro }) para no copiar los textos al navegador.
export function StoriesProvider({ children }) {
  const [moderation, setModeration] = usePersistentState('storyModeration', {})

  const stories = useMemo(
    () => initialStories.map((story) => (moderation[story.id] ? { ...story, moderation: moderation[story.id] } : story)),
    [moderation],
  )
  // Lo que ve el sitio público: sin las historias retiradas por PetMind.
  const publicStories = useMemo(() => stories.filter((story) => !isHidden(story)), [stories])

  function getStoryById(id) {
    return stories.find((story) => story.id === id)
  }

  // record = hiddenRecord(...) para retirarla o null para restaurarla.
  function moderateStory(id, record) {
    setModeration((prev) => {
      const next = { ...prev }
      if (record) next[id] = record
      else delete next[id]
      return next
    })
  }

  const value = { stories, publicStories, getStoryById, moderateStory }

  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>
}
