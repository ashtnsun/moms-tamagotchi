import { useState, useCallback, useRef } from 'react'
import type { GameState, CharacterState, AgeStage } from '../types'
import { loadState, saveState, getInitialState } from '../utils/localStorage'

function xpPerLevel(level: number): number {
  if (level <= 9)  return 5
  if (level <= 14) return 6
  if (level <= 19) return 7
  return 8  // levels 20–24
}

function ageForLevel(level: number): AgeStage {
  if (level < 10) return 'baby'
  if (level < 15) return 'adolescent'
  if (level < 20) return 'teen'
  return 'adult'
}

function applyXP(
  char: CharacterState,
  amount: number
): { char: CharacterState } {
  if (char.level >= 25) return { char }

  let { xp, level, age, mood } = char
  xp += amount

  while (level < 25 && xp >= xpPerLevel(level)) {
    xp -= xpPerLevel(level)
    level += 1
    const newAge = ageForLevel(level)
    if (newAge !== age) age = newAge
    mood = 'happy'
  }

  if (level >= 25) xp = 0

  return { char: { ...char, xp, level, age, mood } }
}

function awardXPBoth(state: GameState, amount: number): GameState {
  const aRes = applyXP(state.characters.ashton, amount)
  const sRes = applyXP(state.characters.sharon, amount)
  return {
    ...state,
    characters: { ashton: aRes.char, sharon: sRes.char },
  }
}

export function useGameState() {
  const [state, setStateRaw] = useState<GameState>(() => loadState() ?? getInitialState())
  const moodTimers = useRef<Partial<Record<'ashton' | 'sharon', ReturnType<typeof setTimeout>>>>({})

  const setState = useCallback((updater: (prev: GameState) => GameState) => {
    setStateRaw(prev => {
      const next = updater(prev)
      saveState(next)
      return next
    })
  }, [])

  function scheduleRevertFor(id: 'ashton' | 'sharon') {
    clearTimeout(moodTimers.current[id])
    moodTimers.current[id] = setTimeout(() => {
      setState(prev => {
        const c = prev.characters[id]
        if (!c.alive || c.mood !== 'happy') return prev
        return { ...prev, characters: { ...prev.characters, [id]: { ...c, mood: 'normal' } } }
      })
    }, 5_000)
  }

  // Calorie logging — max 3 XP per day from this source
  const logCalories = useCallback((amount: number, name?: string) => {
    setState(prev => {
      const entry = { name, amount, timestamp: Date.now() }
      if (prev.calorieXPToday >= 3) {
        return { ...prev, calorieLog: [...prev.calorieLog, entry] }
      }
      const aLevelBefore = prev.characters.ashton.level
      const sLevelBefore = prev.characters.sharon.level
      const next = awardXPBoth(prev, 1)
      if (next.characters.ashton.level > aLevelBefore) scheduleRevertFor('ashton')
      if (next.characters.sharon.level > sLevelBefore) scheduleRevertFor('sharon')
      return {
        ...next,
        calorieXPToday: prev.calorieXPToday + 1,
        calorieLog: [...next.calorieLog, entry],
      }
    })
  }, [setState])

  // Activity logging — max 3 XP per day from this source
  const logActivity = useCallback((activity: string, duration: number) => {
    setState(prev => {
      const entry = { activity, duration, timestamp: Date.now() }
      if (prev.activityXPToday >= 3) {
        return { ...prev, activityLog: [...prev.activityLog, entry] }
      }
      const aLevelBefore = prev.characters.ashton.level
      const sLevelBefore = prev.characters.sharon.level
      const next = awardXPBoth(prev, 1)
      if (next.characters.ashton.level > aLevelBefore) scheduleRevertFor('ashton')
      if (next.characters.sharon.level > sLevelBefore) scheduleRevertFor('sharon')
      return {
        ...next,
        activityXPToday: prev.activityXPToday + 1,
        activityLog: [...next.activityLog, entry],
      }
    })
  }, [setState])

  const feedCharacter = useCallback((id: 'ashton' | 'sharon', xpGain: number) => {
    setState(prev => {
      const char = prev.characters[id]
      if (!char.alive) return prev
      const { char: updated } = applyXP(char, xpGain)
      scheduleRevertFor(id)
      const fed: CharacterState = {
        ...updated,
        mood: 'happy',
        foodCountToday: char.foodCountToday + 1,
        lastFedTimestamp: Date.now(),
        daysWithoutFood: 0,
      }
      return {
        ...prev,
        characters: { ...prev.characters, [id]: fed },
      }
    })
  }, [setState])

  // Petting — triggers happy mood + bounce every time, awards XP only once per day
  const petCharacter = useCallback((id: 'ashton' | 'sharon') => {
    setState(prev => {
      const char = prev.characters[id]
      if (!char.alive) return prev
      scheduleRevertFor(id)

      if (!prev.petXPAwardedToday[id]) {
        const { char: updated } = applyXP(char, 1)
        return {
          ...prev,
          petXPAwardedToday: { ...prev.petXPAwardedToday, [id]: true },
          characters: { ...prev.characters, [id]: { ...updated, mood: 'happy' } },
        }
      }

      // Already petted today — still go happy, no XP
      return {
        ...prev,
        characters: { ...prev.characters, [id]: { ...char, mood: 'happy' } },
      }
    })
  }, [setState])

  const buyFood = useCallback((cost: 1 | 2 | 3) => {
    setState(prev => {
      if (prev.hearts < cost) return prev
      return { ...prev, hearts: prev.hearts - cost }
    })
  }, [setState])

  const buyClothing = useCallback((
    itemId: string,
    cost: number,
    xpGain: number,
    forCharacter: 'ashton' | 'sharon'
  ) => {
    setState(prev => {
      if (prev.hearts < cost) return prev
      if (prev.purchasedClothing.includes(itemId)) return prev
      const char = prev.characters[forCharacter]
      const { char: updated } = applyXP(char, xpGain)
      const withMood: CharacterState = { ...updated, mood: 'happy' }
      scheduleRevertFor(forCharacter)
      return {
        ...prev,
        hearts: prev.hearts - cost,
        purchasedClothing: [...prev.purchasedClothing, itemId],
        characters: { ...prev.characters, [forCharacter]: withMood },
      }
    })
  }, [setState])

  const updateSettings = useCallback((calorieGoal: number, activityGoal: number) => {
    setState(prev => ({ ...prev, calorieGoal, activityGoal }))
  }, [setState])

  // Prestige: 'prestige' increments level + multiplier; 'reset' keeps them unchanged.
  // 'gameover' is handled in App.tsx via clearState + reload.
  const doPrestige = useCallback((mode: 'prestige' | 'reset') => {
    setState(prev => {
      const initial = getInitialState()
      const newPrestigeLevel = mode === 'prestige' ? prev.prestigeLevel + 1 : prev.prestigeLevel
      const newMultiplier = mode === 'prestige'
        ? Math.ceil(prev.prestigeRewardMultiplier * 1.5)
        : prev.prestigeRewardMultiplier

      return {
        ...prev,
        prestigeLevel: newPrestigeLevel,
        prestigeRewardMultiplier: newMultiplier,
        characters: {
          ashton: { ...initial.characters.ashton },
          sharon: { ...initial.characters.sharon },
        },
        calorieLog: [],
        activityLog: [],
        calorieXPToday: 0,
        activityXPToday: 0,
        petXPAwardedToday: { ashton: false, sharon: false },
        lastResetHearts: 0,
        lastDayReset: Date.now(),
      }
    })
  }, [setState])

  const applyDayReset = useCallback((updater: (prev: GameState) => GameState) => {
    setState(updater)
  }, [setState])

  return {
    state,
    logCalories,
    logActivity,
    feedCharacter,
    petCharacter,
    buyFood,
    buyClothing,
    updateSettings,
    doPrestige,
    applyDayReset,
  }
}
