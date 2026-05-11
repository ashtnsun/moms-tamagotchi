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

function processCharacter(char: CharacterState): CharacterState {
  if (!char.alive) return char

  let updated = { ...char, foodCountToday: 0 }

  if (char.foodCountToday === 0) {
    updated.daysWithoutFood = char.daysWithoutFood + 1
    // Death threshold: 3 days without food
    if (updated.daysWithoutFood >= 3) {
      updated.alive = false
      return updated
    }
    updated.weight = nextWeight(char.weight, -1)
  } else if (char.foodCountToday > 3) {
    updated.weight = nextWeight(char.weight, 1)
  } else {
    updated.daysWithoutFood = 0
  }

  return updated
}

export function useDayCycle(applyDayReset: (updater: (prev: GameState) => GameState) => void) {
  useEffect(() => {
    function check() {
      applyDayReset(prev => {
        const now = Date.now()
        const boundary = last4amBefore(now)
        if (prev.lastDayReset >= boundary) return prev

        const ashton = processCharacter(prev.characters.ashton)
        const sharon = processCharacter(prev.characters.sharon)

        // Calorie reward: logged between 1000 kcal and the goal (inclusive)
        const caloriesTotal = prev.calorieLog.reduce((sum, e) => sum + e.amount, 0)
        const calorieBonus = (caloriesTotal >= 1000 && caloriesTotal <= prev.calorieGoal)
          ? prev.prestigeRewardMultiplier
          : 0

        // Activity reward: met or exceeded the goal
        const activityTotal = prev.activityLog.reduce((sum, e) => sum + e.duration, 0)
        const activityBonus = activityTotal >= prev.activityGoal
          ? prev.prestigeRewardMultiplier
          : 0

        const totalHeartsGained = calorieBonus + activityBonus

        return {
          ...prev,
          calorieLog: [],
          activityLog: [],
          hearts: prev.hearts + totalHeartsGained,
          lastDayReset: now,
          lastResetHearts: totalHeartsGained,
          calorieXPToday: 0,
          activityXPToday: 0,
          petXPAwardedToday: { ashton: false, sharon: false },
          characters: { ashton, sharon },
        }
      })
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [applyDayReset])
}
