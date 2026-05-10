import type { CharacterState, GameState } from '../types'

const STORAGE_KEY = 'moms-tamagotchi-state'

function makeCharacter(id: 'ashton' | 'sharon'): CharacterState {
  return {
    id,
    age: 'baby',
    weight: 'normal',
    mood: 'normal',
    alive: true,
    xp: 0,
    level: 1,
    foodCountToday: 0,
    lastFedTimestamp: 0,
    daysWithoutFood: 0,
    equippedClothing: { top: null, pants: null, shoes: null, hat: null },
    lastPetTimestamp: 0,
  }
}

export function getInitialState(): GameState {
  return {
    characters: {
      ashton: makeCharacter('ashton'),
      sharon: makeCharacter('sharon'),
    },
    hearts: 10,
    calorieLog: [],
    calorieGoal: 2000,
    activityLog: [],
    activityGoal: 60,
    purchasedClothing: [],
    lastDayReset: Date.now(),
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GameState
  } catch {
    return null
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage quota exceeded — silently ignore
  }
}
