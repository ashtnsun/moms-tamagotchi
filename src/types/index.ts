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
  lastPetTimestamp: number
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
}
