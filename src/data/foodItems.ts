export interface FoodItem {
  id: string
  name: string
  cost: 1 | 2 | 3
  emoji: string
}

export const FOOD_ITEMS: FoodItem[] = [
  // 1-heart
  { id: 'onigiri',       name: 'Onigiri',       cost: 1, emoji: '🍙' },
  { id: 'steamed_bun',   name: 'Steamed Bun',   cost: 1, emoji: '🥟' },
  { id: 'mochi',         name: 'Mochi',          cost: 1, emoji: '🍡' },
  { id: 'seaweed_snack', name: 'Seaweed Snack',  cost: 1, emoji: '🌿' },
  { id: 'tamagoyaki',    name: 'Tamagoyaki',     cost: 1, emoji: '🍳' },
  // 2-heart
  { id: 'ramen',         name: 'Ramen',          cost: 2, emoji: '🍜' },
  { id: 'sushi_roll',    name: 'Sushi Roll',     cost: 2, emoji: '🍣' },
  { id: 'bibimbap',      name: 'Bibimbap',       cost: 2, emoji: '🍚' },
  { id: 'dumplings',     name: 'Dumplings',      cost: 2, emoji: '🥟' },
  { id: 'takoyaki',      name: 'Takoyaki',       cost: 2, emoji: '🐙' },
  // 3-heart
  { id: 'hot_pot',       name: 'Hot Pot',        cost: 3, emoji: '🍲' },
  { id: 'wagyu_beef',    name: 'Wagyu Beef',     cost: 3, emoji: '🥩' },
  { id: 'birthday_cake', name: 'Birthday Cake',  cost: 3, emoji: '🎂' },
  { id: 'boba_tea',      name: 'Boba Tea',       cost: 3, emoji: '🧋' },
  { id: 'omakase_sushi', name: 'Omakase Sushi',  cost: 3, emoji: '🍱' },
]
