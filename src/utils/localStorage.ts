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
    calorieXPToday: 0,
    activityXPToday: 0,
    petXPAwardedToday: { ashton: false, sharon: false },
    prestigeLevel: 0,
    prestigeRewardMultiplier: 2,  // per-reward heart count; grows ×1.5 on each prestige
    lastResetHearts: 0,
  }
}

function migrateCharacter(
  saved: Partial<CharacterState> | undefined,
  id: 'ashton' | 'sharon'
): CharacterState {
  const initial = makeCharacter(id)
  if (!saved) return initial
  return {
    ...initial,
    ...saved,
    equippedClothing: {
      ...initial.equippedClothing,
      ...(saved.equippedClothing ?? {}),
    },
  }
}

function migrateState(saved: Partial<GameState>): GameState {
  const initial = getInitialState()
  return {
    ...initial,
    ...saved,
    characters: {
      ashton: migrateCharacter(saved.characters?.ashton, 'ashton'),
      sharon: migrateCharacter(saved.characters?.sharon, 'sharon'),
    },
    petXPAwardedToday: {
      ashton: false,
      sharon: false,
      ...(saved.petXPAwardedToday ?? {}),
    },
  }
}

export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return migrateState(JSON.parse(raw) as Partial<GameState>)
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

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
