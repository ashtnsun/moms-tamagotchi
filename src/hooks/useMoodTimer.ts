import { useEffect } from 'react'
import type { GameState } from '../types'

// Randomly shift moods every 2-4 hours. Never randomly assigns happy.
export function useMoodTimer(
  applyUpdate: (updater: (prev: GameState) => GameState) => void
) {
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const ms = (2 + Math.random() * 2) * 60 * 60 * 1000 // 2–4 hours
      id = setTimeout(() => {
        applyUpdate(prev => {
          const chars = { ...prev.characters }
          for (const key of ['ashton', 'sharon'] as const) {
            const c = chars[key]
            if (!c.alive) continue
            const mood =
              c.mood === 'happy' ? 'normal'
              : c.mood === 'normal' ? (Math.random() < 0.5 ? 'normal' : 'sad')
              : 'sad' // sad stays sad until a positive action
            chars[key] = { ...c, mood }
          }
          return { ...prev, characters: chars }
        })
        scheduleNext()
      }, ms)
    }

    scheduleNext()
    return () => clearTimeout(id)
  }, [applyUpdate])
}
