export type AgeStage = 'baby' | 'adolescent' | 'teen' | 'adult'
export type WeightStage = 'skinny' | 'normal' | 'bigger' | 'obese'
export type MoodState = 'happy' | 'normal'

export interface CharacterState {
  id: 'ashton' | 'sharon'
  age: AgeStage
  weight: WeightStage
  mood: MoodState
  alive: boolean
  xp: number
  level: number
  foodCountToday: number
  lastFedTimestamp: number
  daysWithoutFood: number
  equippedClothing: {
    top: string | null
    pants: string | null
    shoes: string | null
    hat: string | null
  }
  lastPetTimestamp: number  // kept for migration compat; no longer used for cooldown
}

export interface GameState {
  characters: {
    ashton: CharacterState
    sharon: CharacterState
  }
  hearts: number
  calorieLog: { name?: string; amount: number; timestamp: number }[]
  calorieGoal: number
  activityLog: { activity: string; duration: number; timestamp: number }[]
  activityGoal: number
  purchasedClothing: string[]
  lastDayReset: number
  // XP daily caps (reset at 4am)
  calorieXPToday: number
  activityXPToday: number
  // Petting XP — awarded once per day per character
  petXPAwardedToday: { ashton: boolean; sharon: boolean }
  // Prestige
  prestigeLevel: number
  // Stores the actual per-reward heart amount; starts at 2, grows by ×1.5 (rounded up) on each prestige
  prestigeRewardMultiplier: number
  // Hearts awarded at the most recent 4am reset (for character notification)
  lastResetHearts: number
}
