import type { GameState } from '../types'

// Disabled — mood system no longer uses random timers or sad state.
export function useMoodTimer(
  _applyUpdate: (updater: (prev: GameState) => GameState) => void
) {}
