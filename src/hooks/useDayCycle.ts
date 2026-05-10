import { useEffect } from 'react'
import type { GameState, CharacterState, WeightStage } from '../types'

const WEIGHT_STAGES: WeightStage[] = ['skinny', 'normal', 'bigger', 'obese']

function nextWeight(current: WeightStage, direction: 1 | -1): WeightStage {
  const idx = WEIGHT_STAGES.indexOf(current)
  return WEIGHT_STAGES[Math.max(0, Math.min(WEIGHT_STAGES.length - 1, idx + direction))]
}

function last4amBefore(now: number): number {
  const d = new Date(now)
  d.setHours(4, 0, 0, 0)
  if (d.getTime() > now) d.setDate(d.getDate() - 1)
  return d.getTime()
}

function processCharacter(char: CharacterState): { char: CharacterState; heartsGained: number } {
  if (!char.alive) return { char, heartsGained: 0 }

  let updated = { ...char, foodCountToday: 0 }

  if (char.foodCountToday === 0) {
    updated.daysWithoutFood = char.daysWithoutFood + 1
    if (updated.daysWithoutFood >= 5) {
      updated.alive = false
      return { char: updated, heartsGained: 0 }
    }
    updated.weight = nextWeight(char.weight, -1)
  } else if (char.foodCountToday > 3) {
    updated.weight = nextWeight(char.weight, 1)
  } else {
    updated.daysWithoutFood = 0
  }

  return { char: updated, heartsGained: 0 }
}

export function useDayCycle(applyDayReset: (updater: (prev: GameState) => GameState) => void) {
  useEffect(() => {
    function check() {
      applyDayReset(prev => {
        const now = Date.now()
        const boundary = last4amBefore(now)
        if (prev.lastDayReset >= boundary) return prev

        const aRes = processCharacter(prev.characters.ashton)
        const sRes = processCharacter(prev.characters.sharon)

        const activityTotal = prev.activityLog.reduce((sum, e) => sum + e.duration, 0)
        const activityBonus = activityTotal >= prev.activityGoal ? 1 : 0

        return {
          ...prev,
          calorieLog: [],
          activityLog: [],
          hearts: prev.hearts + activityBonus,
          lastDayReset: now,
          characters: {
            ashton: aRes.char,
            sharon: sRes.char,
          },
        }
      })
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [applyDayReset])
}
