# CLAUDE.md — Mom's Tamagotchi

Read this file at the start of every session before touching any code.

---

## Project overview

A Mother's Day gift web app — a Tamagotchi-style game featuring two pixel characters (Ashton and Sharon) that the user (Mom) manages. Includes practical daily tracking tools. Built with React + TypeScript + Vite, styled with Tailwind CSS, persisted with localStorage, deployed on Vercel via GitHub.

---

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- localStorage (no backend, no auth)
- Deployed: GitHub → Vercel (auto-deploy on push to main)

---

## File structure

```
src/
  assets/
    sprites/
      ashton/
        baby_normal.png, baby_happy.png, baby_sad.png
        adolescent_normal.png, adolescent_happy.png, adolescent_sad.png
        teen_normal.png, teen_happy.png, teen_sad.png
        adult_normal.png, adult_happy.png, adult_sad.png
      sharon/
        (same 12 files)
      shared/
        gravestone.png
  components/
    Character.tsx
    CalorieTracker.tsx
    ActivityTracker.tsx
    Shop.tsx
    Settings.tsx
    ProgressBar.tsx
    HeartsDisplay.tsx
  hooks/
    useGameState.ts
    useDayCycle.ts
    usePetCooldown.ts
  types/
    index.ts
  utils/
    localStorage.ts
    xpHelpers.ts
  App.tsx
  main.tsx
```

---

## Types

Define these in `src/types/index.ts`:

```ts
type AgeStage = 'baby' | 'adolescent' | 'teen' | 'adult';
type WeightStage = 'skinny' | 'normal' | 'bigger' | 'obese';
type MoodState = 'happy' | 'normal' | 'sad';

interface CharacterState {
  id: 'ashton' | 'sharon';
  age: AgeStage;
  weight: WeightStage;
  mood: MoodState;
  alive: boolean;
  xp: number;
  level: number;
  foodCountToday: number;      // resets at 4am
  lastFedTimestamp: number;    // unix ms
  daysWithoutFood: number;
  equippedClothing: {
    top: string | null;
    pants: string | null;
    shoes: string | null;
    hat: string | null;
  };
  lastPetTimestamp: number;    // unix ms, for 1hr cooldown
}

interface GameState {
  characters: {
    ashton: CharacterState;
    sharon: CharacterState;
  };
  hearts: number;
  calorieLog: { amount: number; timestamp: number }[];
  calorieGoal: number;          // default 2000
  activityLog: { activity: string; duration: number; timestamp: number }[];
  activityGoal: number;         // default 60 (minutes)
  purchasedClothing: string[];  // array of item ids the user owns
  lastDayReset: number;         // unix ms timestamp of last 4am reset
}
```

---

## localStorage

All state lives in one key: `moms-tamagotchi-state`.

`src/utils/localStorage.ts` should export:
- `loadState(): GameState | null`
- `saveState(state: GameState): void`
- `getInitialState(): GameState`

Save state after every user action. Do not debounce — save immediately.

---

## Day cycle

A "day" resets at 4:00 AM local time.

`src/hooks/useDayCycle.ts` — on mount and every 60 seconds, check if current time has crossed a 4am boundary since `lastDayReset`. If so:
- Reset `calorieLog`, `activityLog`, `foodCountToday` for both characters
- Check food rules per character:
  - If `foodCountToday === 0`: increment `daysWithoutFood`, set mood to sad
  - If `daysWithoutFood >= 3`: set `alive = false`
  - If `foodCountToday > 3`: increment weight stage by one (max: obese)
  - If `foodCountToday === 0` for the day: decrement weight stage by one (min: skinny)
- Check activity goal: if filled, award +1 heart
- Update `lastDayReset`

---

## Character states

### Age stages and leveling

| Level range | Age stage  | XP to level up |
|-------------|------------|----------------|
| 1 – 9       | baby       | 5 XP per level |
| 10 – 14     | adolescent | 6 XP per level |
| 15 – 19     | teen       | 7 XP per level |
| 20 – 24     | adult      | 8 XP per level |
| 25          | adult      | prestige eligible (XP capped at 0) |

Age transitions:
- Reaching level 10 → adolescent
- Reaching level 15 → teen
- Reaching level 20 → adult
- Reaching level 25 → prestige eligible (no further age change)

On level up: set mood to happy. No hearts awarded.
On age transition: set mood to happy. No hearts awarded.

### Weight

CSS `transform: scaleX()` approximation — do not require separate sprite files:
- skinny: `scaleX(0.82)`
- normal: `scaleX(1)`
- bigger: `scaleX(1.18)`
- obese: `scaleX(1.35)`

### Mood

Sprite file changes based on mood: `{age}_{mood}.png`

Random mood changes: every 2–4 hours (random interval), set mood to 'normal' if currently happy, or randomly pick normal/sad. Happy mood is always triggered by specific actions (see below) and overrides random.

Happy mood triggers:
- Fed food
- Clothing item bought/equipped
- Petted (with cooldown)
- Level up or age transition

Sad mood triggers:
- No food for a full day

### Death

If `alive === false`, render `gravestone.png` instead of the character sprite. No interactions possible on dead characters. Show a "💀 {name} passed away" label.

---

## XP gains

| Action | XP |
|--------|----|
| Log calories | +1 (shared between both characters) |
| Log activity | +1 (shared) |
| Feed 1-heart food | +1 to fed character |
| Feed 2-heart food | +3 to fed character |
| Feed 3-heart food | +5 to fed character |
| Buy 1-heart clothing | +1 to character it belongs to |
| Buy 2-heart clothing | +3 to character it belongs to |
| Buy 3-heart clothing | +5 to character it belongs to |

"Shared" means +1 XP to both Ashton and Sharon simultaneously.

---

## Hearts (currency)

Gains:
- Day reset rewards (at 4am): calories logged in [1000, calorieGoal] → +prestigeRewardMultiplier hearts; activity ≥ activityGoal → +prestigeRewardMultiplier hearts (both earnable same day)

Level ups and age transitions do NOT award hearts.

Spending: clothing items and food cost 1–3 hearts. Deduct on purchase. If hearts < cost, block purchase and show "not enough hearts."

---

## Petting mechanic

When user taps/clicks a character:
- Triggers happy mood + bounce animation every time
- Awards 1 XP once per day per character (tracked via `petXPAwardedToday: {ashton: boolean, sharon: boolean}`, reset at 4am)
- If already petted today: shows "already petted today!" notification, still triggers bounce
- No hearts awarded from petting
- No 1-hour cooldown

---

## Main screen layout

```
┌─────────────────────────────────────┐
│  [Calories] [Activity]     ♥ 5      │
├─────────────────────────────────────┤
│  🔥 Calories: ████░░░ 1200/2000     │
│  ⚡ Activity: ██░░░░░ 20/60 min     │
│                                     │
│   [Ashton sprite]  [Sharon sprite]  │
│    Lv.3 Baby        Lv.2 Baby       │
│                                     │
├─────────────────────────────────────┤
│    [Shop]              [⚙ Settings] │
└─────────────────────────────────────┘
```

The background should be a soft pixel-art style scene (grass, simple sky). Use CSS or a static background image. Keep the game contained to a max-width of 680px centered on screen (mobile-first).

Hearts display: one pixel SVG heart icon followed by the count as a number (e.g. ♥ 5), not multiple individual hearts.

---

## Calorie tracker popup

Triggered by [Calories] button. Modal overlay.

Fields:
- Food name (text input, optional)
- Calories (number input, required)
- [Log] button

On log: append to `calorieLog`, update progress bar, award +1 XP to both characters, close modal.

---

## Activity tracker popup

Triggered by [Activity] button. Modal overlay.

Fields:
- Activity name (text input, e.g. "walk", "yoga")
- Duration in minutes (number input)
- [Log] button

On log: append to `activityLog`, sum durations vs `activityGoal` for progress bar, award +1 XP to both characters, close modal.

---

## Closet — DEFERRED

Clothing / outfit system is deferred to a future phase. There is no Closet button in the UI. The `purchasedClothing` field remains in `GameState` for forward compatibility but is unused until this feature is built.

---

## Shop

Triggered by [Shop] button. Modal overlay.

Shows a grid of food items. Define in `src/data/foodItems.ts`:
```ts
interface FoodItem {
  id: string;
  name: string;
  cost: 1 | 2 | 3;
  emoji: string;   // for display until pixel art is ready
}
```
Populate with ~15 items (5 per cost tier). Examples: "Rice Ball" (1❤), "Ramen" (2❤), "Birthday Cake" (3❤).

On [Buy]:
- Deduct hearts
- Animate: food item drops from top of screen into the center (CSS keyframe animation, ~600ms)
- Food item becomes draggable (use pointer events)
- User drags food onto either character sprite to feed
- On drop: increment `foodCountToday`, apply XP, set mood to happy, remove food from screen

File: `src/components/Shop.tsx` and `src/data/foodItems.ts`

---

## Settings

Triggered by [⚙ Settings] button in the bottom bar. Opens as a side panel (see UI CONVENTIONS).

Options:
- Calorie goal (number input, default 2000)
- Activity goal in minutes (number input, default 60)
- [Save] button — updates state, closes panel

---

## UI CONVENTIONS

**Popup placement — never overlay the game scene.**

All interactive panels (Shop, Settings, Calories, Activity) open OUTSIDE the main game frame, in the surrounding sky-blue space. They are positioned to the left or right of the frame, vertically top-aligned with its outer border.

Implementation:
- Popups render as `position: absolute` children of `.game-frame` (not of `.game-container`)
- Right-side popup: `left: calc(100% + 28px); top: -7px`
- Left-side popup: `right: calc(100% + 28px); top: -7px`
- The `-7px` offset accounts for `.game-frame`'s 4px outer border + 3px padding gap, so the popup visually aligns with the outer frame top edge
- All popups use the same double-border style as the main frame (4px dark brown outer, 3px cream gap, 2px tan inner, `border-radius: 8px`)
- The `.popup-panel` + `.popup-inner` CSS classes provide this styling

Side assignment (current plan):
- Shop → left side
- Settings → right side
- Calories → right side (below Settings if both open, or stacked)
- Activity → right side

Do NOT use `position: fixed` overlays or modal backdrops that cover the game scene.

---

## Sprite rendering

`src/components/Character.tsx`

```tsx
// Pseudo-logic
const spritePath = character.alive
  ? `/src/assets/sprites/${character.id}/${character.age}_${character.mood}.png`
  : `/src/assets/sprites/shared/gravestone.png`;

const weightScale = {
  skinny: 'scaleX(0.82)',
  normal: 'scaleX(1)',
  bigger: 'scaleX(1.18)',
  obese: 'scaleX(1.35)',
}[character.weight];

// Render:
<div style={{ transform: weightScale }}>
  <img src={spritePath} alt={character.id} />
  {/* clothing overlay layers on top */}
</div>
```

Use placeholder colored rectangles for missing sprites — never crash on missing images. Add `onError` fallback.

---

## Pixel art aesthetic

- Font: use `Press Start 2P` from Google Fonts for all UI text
- Color palette: warm creams, soft greens, pixel-style UI borders (2px solid, slightly rounded)
- Buttons: pixel-style with slight drop shadow offset (4px), no hover transitions — instant state change
- Progress bars: chunky, segmented pixel style
- Modals: slide up from bottom or fade in, pixel border
- Background: soft pastel pixel scene — light blue sky, green ground, maybe simple clouds

---

## Phase plan for Claude Code sessions

Build in this order. Complete each phase fully before moving on.

### Phase 1 — Static layout
- Main screen with placeholder character boxes (colored divs)
- Top bar: 2 function buttons + hearts counter (pixel heart icon + number)
- Progress bars (static, hardcoded values) with 🔥/⚡ emoji labels and variant colors
- Bottom bar: Shop button (left) + Settings button (right)
- Press Start 2P font loaded
- Pixel aesthetic applied (colors, borders, buttons)
- Mobile-first, max-width 680px centered

### Phase 2 — State engine
- Define all types in `src/types/index.ts`
- `useGameState` hook with full `GameState`
- `localStorage.ts` — load, save, getInitialState
- `useDayCycle` hook — 4am reset logic
- Wire hearts counter to state
- Wire progress bars to real calorie/activity data

### Phase 3 — Calorie + activity trackers
- Calorie popup — log form, progress bar update, XP award
- Activity popup — log form, progress bar update, XP award

### Phase 4 — Character component
- `Character.tsx` with sprite rendering
- Weight CSS scale transform
- Mood-based sprite path
- Alive/dead gravestone logic
- Petting mechanic with cooldown
- XP and leveling logic
- Age transition logic

### Phase 5 — Shop
- Food item data (`src/data/foodItems.ts`)
- Shop modal with grid (`src/components/Shop.tsx`)
- Buy → drop animation → draggable → feed mechanic
- XP + foodCountToday update

### Phase 6 — Settings
- Settings modal
- Calorie/activity goal configuration

### Phase 7 — Polish
- Pixel background scene
- Mood random timer
- Level-up / age-transition celebration animation
- Death state
- Test all localStorage persistence
- Test day reset at 4am

---

## Prestige system

**GameState fields:**
- `prestigeLevel: number` — starts 0; increments on each prestige
- `prestigeRewardMultiplier: number` — starts 2 (actual per-reward heart count); grows `Math.ceil(n × 1.5)` on each prestige (sequence: 2 → 3 → 5 → 8…)
- `lastResetHearts: number` — hearts awarded at the most recent 4am reset (for character notification)

**Banner conditions (shown between progress bars and scene):**
- A: both chars level ≥ 25 AND both alive → gold pulsing banner "★ PRESTIGE AVAILABLE!", [Prestige!] button
- B: both chars level ≥ 25, at least one dead → muted banner "RESET AVAILABLE", [Reset] button
- C: both chars dead, neither at level ≥ 25 → red banner "GAME OVER", [Reset] → clearState() + reload

**Prestige action (mode = 'prestige' | 'reset'):**
- `prestigeLevel++` (prestige only)
- `prestigeRewardMultiplier = Math.ceil(current × 1.5)` (prestige only)
- Both chars reset to level 1, baby, alive
- `calorieLog`, `activityLog`, XP counters, petXPAwardedToday reset
- Hearts and `purchasedClothing` are kept

**Top bar:** show `★ Prestige {n}` in gold (8px) if `prestigeLevel > 0`

**Celebration:** prestige fires 12-star burst + name flash on both characters + scene gold flash overlay (1s)

**XP daily caps:**
- `calorieXPToday: number` — max 3 XP/day from calorie logging; still appends the log entry when capped
- `activityXPToday: number` — max 3 XP/day from activity logging; same behavior
- Both reset at 4am

---

## How to start each Claude Code session

1. `Read CLAUDE.md`
2. `Read src/` directory structure
3. State which phase you are on
4. Complete that phase fully before asking what's next

---

## Dev server

```bash
npm run dev
# runs at http://localhost:5173
```

## Deploy

Push to `main` branch on GitHub. Vercel auto-deploys.

