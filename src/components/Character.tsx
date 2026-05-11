import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { CharacterState } from '../types'
import { PixelHeart } from './PixelHeart'

const SPRITES = import.meta.glob<{ default: string }>(
  '/src/assets/sprites/**/*.png',
  { eager: true }
)
const CLOTHING_IMGS = import.meta.glob<{ default: string }>(
  '/src/assets/clothing/**/*.png',
  { eager: true }
)

function getSpriteUrl(path: string): string | null {
  return SPRITES[path]?.default ?? null
}
function getClothingUrl(itemId: string): string | null {
  return CLOTHING_IMGS[`/src/assets/clothing/${itemId}.png`]?.default ?? null
}

function xpNeeded(level: number): number {
  if (level <= 9)  return 5
  if (level <= 14) return 6
  if (level <= 19) return 7
  return 8  // levels 20–24
}

const WEIGHT_SCALE: Record<string, number> = {
  skinny: 0.82, normal: 1, bigger: 1.18, obese: 1.35,
}

// 8 directions for level-up burst
const DIRS_8: [number, number][] = [
  [0, -1], [0.707, -0.707], [1, 0], [0.707, 0.707],
  [0, 1], [-0.707, 0.707], [-1, 0], [-0.707, -0.707],
]
// 12 directions for age-transition / prestige burst
const DIRS_12: [number, number][] = [
  [0, -1], [0.5, -0.866], [0.866, -0.5], [1, 0],
  [0.866, 0.5], [0.5, 0.866], [0, 1], [-0.5, 0.866],
  [-0.866, 0.5], [-1, 0], [-0.866, -0.5], [-0.5, -0.866],
]

type NotifType = 'xp' | 'heart' | 'levelup' | 'cooldown'
interface Notif { id: number; content: ReactNode; type: NotifType }

type CelebMode = 'levelup' | 'age' | null

interface Props {
  char: CharacterState
  onPet: (id: 'ashton' | 'sharon') => void
  petXPAwarded: boolean      // true if XP already given today
  dayResetTs: number         // state.lastDayReset — fires the day-reset notification
  dayResetHearts: number     // hearts awarded at that reset
  prestigeEvent: number      // increments on prestige → triggers celebration
}

export function Character({ char, onPet, petXPAwarded, dayResetTs, dayResetHearts, prestigeEvent }: Props) {
  const [imgError, setImgError]           = useState(false)
  const [notifs, setNotifs]               = useState<Notif[]>([])
  const [isBouncing, setIsBouncing]       = useState(false)
  const [isCelebBounce, setIsCelebBounce] = useState(false)
  const [celebMode, setCelebMode]         = useState<CelebMode>(null)
  const [nameFlash, setNameFlash]         = useState(false)

  const notifCounter     = useRef(0)
  const prevRef          = useRef({ xp: char.xp, level: char.level, age: char.age as string })
  const prevDayResetRef  = useRef(dayResetTs)
  const prevPrestigeRef  = useRef(prestigeEvent)

  const imgPath = char.alive
    ? `/src/assets/sprites/${char.id}/${char.age}_${char.mood}.png`
    : '/src/assets/sprites/shared/gravestone.png'
  const imgSrc = getSpriteUrl(imgPath)

  useEffect(() => { setImgError(false) }, [imgPath])

  const addNotif = useCallback((content: ReactNode, type: NotifType) => {
    const id = ++notifCounter.current
    setNotifs(prev => [...prev, { id, content, type }])
    setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 6000)
  }, [])

  // Level-up / age-transition celebration
  useEffect(() => {
    const prev = prevRef.current
    const levelGained = char.level > prev.level
    const ageChanged  = char.age !== prev.age
    const xpChanged   = char.xp !== prev.xp || levelGained

    if (levelGained) {
      if (ageChanged) {
        addNotif('grew up!', 'levelup')
        setCelebMode('age')
        setNameFlash(true)
        setTimeout(() => setNameFlash(false), 2000)
      } else {
        setCelebMode('levelup')
      }
      addNotif('Level up!', 'levelup')
      setIsCelebBounce(true)
      setTimeout(() => setIsCelebBounce(false), 500)
      setTimeout(() => setCelebMode(null), 2000)
    } else if (xpChanged) {
      addNotif('+1 XP!', 'xp')
    }

    prevRef.current = { xp: char.xp, level: char.level, age: char.age }
  }, [char.xp, char.level, char.age, addNotif])

  // Day-reset heart notification
  useEffect(() => {
    if (dayResetTs !== prevDayResetRef.current && dayResetHearts > 0) {
      const content = (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          +{dayResetHearts} <PixelHeart size={3} color="#E8607A" />
        </span>
      )
      addNotif(content, 'heart')
    }
    prevDayResetRef.current = dayResetTs
  }, [dayResetTs, dayResetHearts, addNotif])

  // Prestige celebration — 12-star burst + name flash
  useEffect(() => {
    if (prestigeEvent !== prevPrestigeRef.current) {
      setCelebMode('age')
      setNameFlash(true)
      setIsCelebBounce(true)
      setTimeout(() => setNameFlash(false), 2000)
      setTimeout(() => setIsCelebBounce(false), 500)
      setTimeout(() => setCelebMode(null), 2000)
    }
    prevPrestigeRef.current = prestigeEvent
  }, [prestigeEvent])

  function handlePet() {
    if (!char.alive) return
    onPet(char.id)
    setIsBouncing(true)
    setTimeout(() => setIsBouncing(false), 420)
    if (petXPAwarded) {
      addNotif('already petted today!', 'cooldown')
    }
    // When !petXPAwarded, the XP notification fires from the char.xp useEffect
  }

  const name   = char.id === 'ashton' ? 'Ashton' : 'Sharon'
  const wScale = WEIGHT_SCALE[char.weight] ?? 1
  const dirs   = celebMode === 'age' ? DIRS_12 : DIRS_8

  return (
    <div className="character-slot">
      {/* Star burst — absolutely positioned at sprite center */}
      {celebMode && (
        <div className="star-burst" aria-hidden="true">
          {dirs.map(([dx, dy], i) => (
            <div
              key={i}
              className="star-particle"
              style={{ '--dx': `${dx}`, '--dy': `${dy}` } as React.CSSProperties}
            >
              ★
            </div>
          ))}
        </div>
      )}

      {/* Fixed-size notification zone */}
      <div className="char-notif-area">
        {notifs.map((n, i) => (
          <div
            key={n.id}
            className={`char-notif char-notif-${n.type}`}
            style={{ bottom: `${(notifs.length - 1 - i) * 20}px` }}
          >
            {n.content}
          </div>
        ))}
      </div>

      {/*
        Three-layer sprite container.
        Outermost: celebration scale bounce + pointer capture
        Middle: weight scaleX
        Innermost: pet bounce scaleY
      */}
      <div
        className={`char-sprite-outer${isCelebBounce ? ' char-celebrate-bounce' : ''}`}
        style={{ pointerEvents: char.alive ? undefined : 'none' }}
        onPointerDown={e => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerUp={handlePet}
      >
        <div style={{ transform: `scaleX(${wScale})`, width: '100%', height: '100%', position: 'relative' }}>
          <div
            className={isBouncing ? 'char-bounce' : undefined}
            style={{ width: '100%', height: '100%', position: 'relative' }}
          >
            {char.alive ? (
              <>
                {imgSrc && !imgError ? (
                  <img
                    src={imgSrc}
                    alt={name}
                    className="char-sprite-img"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className={`char-placeholder ${char.id === 'ashton' ? 'ashton-box' : 'sharon-box'}`} />
                )}
                {(Object.entries(char.equippedClothing) as [string, string | null][])
                  .filter((e): e is [string, string] => e[1] !== null)
                  .map(([slot, itemId]) => {
                    const url = getClothingUrl(itemId)
                    return url ? (
                      <img key={slot} src={url} alt="" className="char-clothing-overlay"
                        onError={ev => { (ev.target as HTMLImageElement).style.display = 'none' }} />
                    ) : null
                  })}
              </>
            ) : (
              imgSrc && !imgError ? (
                <img
                  src={imgSrc}
                  alt="gravestone"
                  className="char-sprite-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="char-gravestone-fallback">🪦</div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="char-label-group">
        <div className={`char-name${nameFlash ? ' char-name-flash' : ''}`}>{name}</div>
        {!char.alive ? (
          <div className="char-dead-label">RIP {name}</div>
        ) : (
          <>
            <div className="char-info">Lv.{char.level} {char.age}</div>
            {char.level >= 25 ? (
              <div className="xp-label">MAX</div>
            ) : (
              <div className="xp-label">{char.xp} / {xpNeeded(char.level)} xp</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
