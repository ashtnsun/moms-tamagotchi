import { useState, useRef } from 'react'
import './App.css'
import { useGameState } from './hooks/useGameState'
import { useDayCycle } from './hooks/useDayCycle'
import { CalorieTracker } from './components/CalorieTracker'
import { ActivityTracker } from './components/ActivityTracker'
import { Character } from './components/Character'
import { PixelHeart } from './components/PixelHeart'
import { Shop } from './components/Shop'
import { Settings } from './components/Settings'
import { clearState } from './utils/localStorage'
import type { FoodItem } from './data/foodItems'

const TOTAL_SEGMENTS = 10

interface ActiveFood {
  item: FoodItem
  phase: 'falling' | 'idle' | 'dragging' | 'snapping'
  x: number       // viewport px — current food center x
  y: number       // viewport px — current food center y
  centerX: number // scene center (for snap-back)
  centerY: number
}

function xpFromCost(cost: 1 | 2 | 3): number {
  return cost === 1 ? 1 : cost === 2 ? 3 : 5
}

function hitTest(px: number, py: number, el: HTMLElement | null): boolean {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom
}

function ProgressBar({
  label,
  current,
  goal,
  unit = '',
  variant,
}: {
  label: string
  current: number
  goal: number
  unit?: string
  variant: 'calories' | 'activity'
}) {
  const filled = Math.min(
    Math.round((current / goal) * TOTAL_SEGMENTS),
    TOTAL_SEGMENTS
  )

  return (
    <div className="progress-row">
      <span className="progress-label">{label}:</span>
      <div className="progress-track">
        {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => (
          <div
            key={i}
            className={`progress-seg ${
              i < filled ? `seg-filled seg-filled-${variant}` : 'seg-empty'
            }`}
          />
        ))}
      </div>
      <span className={`progress-text progress-text-${variant}`}>
        {current}/{goal}{unit}
      </span>
    </div>
  )
}

export default function App() {
  const {
    state,
    logCalories,
    logActivity,
    petCharacter,
    feedCharacter,
    buyFood,
    updateSettings,
    applyDayReset,
  } = useGameState()
  useDayCycle(applyDayReset)

  const [showSettings, setShowSettings] = useState(false)
  const [showCalories, setShowCalories] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showShop, setShowShop]         = useState(false)
  const [activeFood, setActiveFood]     = useState<ActiveFood | null>(null)

  const sceneRef  = useRef<HTMLDivElement>(null)
  const ashtonRef = useRef<HTMLDivElement>(null)
  const sharonRef = useRef<HTMLDivElement>(null)

  const caloriesTotal = state.calorieLog.reduce((sum, e) => sum + e.amount, 0)
  const activityTotal = state.activityLog.reduce((sum, e) => sum + e.duration, 0)

  // ── Shop buy handler ──────────────────────────────────────────────────────
  function handleBuyFood(item: FoodItem) {
    if (state.hearts < item.cost) return
    buyFood(item.cost)
    const bounds = sceneRef.current?.getBoundingClientRect()
    if (!bounds) return
    const cx = bounds.left + bounds.width / 2
    const cy = bounds.top + bounds.height / 2
    setActiveFood({ item, phase: 'falling', x: cx, y: cy, centerX: cx, centerY: cy })
  }

  // ── Draggable food handlers ───────────────────────────────────────────────
  function handleFoodAnimationEnd() {
    setActiveFood(f => f?.phase === 'falling' ? { ...f, phase: 'idle' } : f)
  }

  function handleFoodPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (activeFood?.phase !== 'idle') return
    e.currentTarget.setPointerCapture(e.pointerId)
    setActiveFood(f => f ? { ...f, phase: 'dragging' } : null)
  }

  function handleFoodPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (activeFood?.phase !== 'dragging') return
    setActiveFood(f => f ? { ...f, x: e.clientX, y: e.clientY } : null)
  }

  function handleFoodPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeFood || activeFood.phase !== 'dragging') return
    const px = e.clientX
    const py = e.clientY

    if (hitTest(px, py, ashtonRef.current)) {
      feedCharacter('ashton', xpFromCost(activeFood.item.cost))
      setActiveFood(null)
    } else if (hitTest(px, py, sharonRef.current)) {
      feedCharacter('sharon', xpFromCost(activeFood.item.cost))
      setActiveFood(null)
    } else {
      // Snap back to scene center
      setActiveFood(f =>
        f ? { ...f, phase: 'snapping', x: f.centerX, y: f.centerY } : null
      )
      setTimeout(
        () => setActiveFood(f => f?.phase === 'snapping' ? { ...f, phase: 'idle' } : f),
        250
      )
    }
  }

  return (
    <div className="game-wrapper">
      {/*
        POPUP CONVENTION — all popups render as position:absolute children of .game-outer.
        Right-side: left: calc(100% + 24px), top: 0
        Left-side:  right: calc(100% + 24px), top: 0
        Shop → left  |  Calories → left  |  Activity → right  |  Settings → right
      */}
      <div className="game-outer">
        <div className="game-mid">
          <div className="game-container">
            {/* Top bar */}
            <div className="top-bar">
              <div className="top-actions">
                <button
                  className={`pixel-btn btn-calories${showCalories ? ' active' : ''}`}
                  onClick={() => setShowCalories(s => !s)}
                >
                  Calories
                </button>
                <button
                  className={`pixel-btn btn-activity${showActivity ? ' active' : ''}`}
                  onClick={() => setShowActivity(s => !s)}
                >
                  Activity
                </button>
              </div>
              <div className="hearts-row">
                <PixelHeart />
                <span className="hearts-count">{state.hearts}</span>
              </div>
            </div>

            {/* Progress bars */}
            <div className="progress-section">
              <ProgressBar
                label="Calories"
                current={caloriesTotal}
                goal={state.calorieGoal}
                variant="calories"
              />
              <ProgressBar
                label="Activity"
                current={activityTotal}
                goal={state.activityGoal}
                unit=" min"
                variant="activity"
              />
            </div>

            {/* Pixel scene with characters */}
            <div className="scene" ref={sceneRef}>
              <div className="scene-sky">
                <div className="cloud cloud-1" />
                <div className="cloud cloud-2" />
              </div>
              <div className="characters-row">
                {/* Wrapper divs give us getBoundingClientRect for hit detection */}
                <div ref={ashtonRef}>
                  <Character char={state.characters.ashton} onPet={petCharacter} />
                </div>
                <div ref={sharonRef}>
                  <Character char={state.characters.sharon} onPet={petCharacter} />
                </div>
              </div>
              <div className="scene-ground" />
            </div>

            {/* Bottom bar */}
            <div className="bottom-bar">
              <button
                className={`pixel-btn btn-shop${showShop ? ' active' : ''}`}
                onClick={() => setShowShop(s => !s)}
              >
                Shop
              </button>
              <button
                className={`pixel-btn btn-settings${showSettings ? ' active' : ''}`}
                onClick={() => setShowSettings(s => !s)}
              >
                ⚙ Settings
              </button>
            </div>
          </div>
        </div>

        {/* Left-side column — Calories on top, Shop below, 12px gap */}
        {(showCalories || showShop) && (
          <div className="popup-col-left">
            {showCalories && (
              <CalorieTracker
                log={state.calorieLog}
                onLog={logCalories}
                onClose={() => setShowCalories(false)}
              />
            )}
            {showShop && (
              <Shop
                hearts={state.hearts}
                onBuy={handleBuyFood}
                onClose={() => setShowShop(false)}
              />
            )}
          </div>
        )}

        {/* Right-side column — Activity on top, Settings below, 12px gap */}
        {(showActivity || showSettings) && (
          <div className="popup-col-right">
            {showActivity && (
              <ActivityTracker
                log={state.activityLog}
                onLog={logActivity}
                onClose={() => setShowActivity(false)}
              />
            )}
            {showSettings && (
              <Settings
                calorieGoal={state.calorieGoal}
                activityGoal={state.activityGoal}
                onSave={updateSettings}
                onReset={() => { clearState(); window.location.reload() }}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>
        )}
      </div>

      {/*
        Draggable food item — position:fixed so it floats above everything
        and is not clipped by any overflow:hidden ancestor.
        Rendered outside .game-outer so popup z-index doesn't stack above it.
      */}
      {activeFood && (
        <div
          className={`scene-food scene-food-${activeFood.phase}`}
          style={{
            left: `${activeFood.x}px`,
            top:  `${activeFood.y - 20}px`,
          }}
          onPointerDown={handleFoodPointerDown}
          onPointerMove={handleFoodPointerMove}
          onPointerUp={handleFoodPointerUp}
          onAnimationEnd={handleFoodAnimationEnd}
        >
          <div className="scene-food-emoji">{activeFood.item.emoji}</div>
          {(activeFood.phase === 'idle' || activeFood.phase === 'snapping') && (
            <div className="scene-food-label">drag to a character!</div>
          )}
        </div>
      )}
    </div>
  )
}
