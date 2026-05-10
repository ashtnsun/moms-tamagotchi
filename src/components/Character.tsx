import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { CharacterState, AgeStage } from '../types'
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

function xpNeeded(age: AgeStage): number {
  return age === 'baby' || age === 'adolescent' ? 5 : 10
}

const WEIGHT_SCALE: Record<string, number> = {
  skinny: 0.82, normal: 1, bigger: 1.18, obese: 1.35,
}

const HEART_NOTIF: ReactNode = (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
    +1 <PixelHeart size={3} color="#E8607A" />
  </span>
)

type NotifType = 'xp' | 'heart' | 'levelup' | 'cooldown'
interface Notif { id: number; content: ReactNode; type: NotifType }

interface Props {
  char: CharacterState
  onPet: (id: 'ashton' | 'sharon') => void
}

export function Character({ char, onPet }: Props) {
  const [imgError, setImgError]   = useState(false)
  const [notifs, setNotifs]       = useState<Notif[]>([])
  const [isBouncing, setIsBouncing] = useState(false)

  const notifCounter = useRef(0)
  const prevRef      = useRef({ xp: char.xp, level: char.level, age: char.age as string })

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

  useEffect(() => {
    const prev = prevRef.current
    const levelGained = char.level > prev.level
    const ageChanged  = char.age !== prev.age
    const xpChanged   = char.xp !== prev.xp || levelGained

    if (levelGained) {
      if (ageChanged) addNotif('grew up!', 'levelup')
      addNotif('Level up!', 'levelup')
      addNotif(HEART_NOTIF, 'heart')
    } else if (xpChanged) {
      addNotif('+1 XP!', 'xp')
    }

    prevRef.current = { xp: char.xp, level: char.level, age: char.age }
  }, [char.xp, char.level, char.age, addNotif])

  function handlePet() {
    if (!char.alive) return
    if (Date.now() - char.lastPetTimestamp < 3_600_000) {
      addNotif('come back later!', 'cooldown')
    } else {
      onPet(char.id)
      setIsBouncing(true)
      setTimeout(() => setIsBouncing(false), 420)
      addNotif(HEART_NOTIF, 'heart')
    }
  }

  const name   = char.id === 'ashton' ? 'Ashton' : 'Sharon'
  const wScale = WEIGHT_SCALE[char.weight] ?? 1

  return (
    <div className="character-slot">
      {/* Fixed-size notification zone — position:relative so notifs are absolute inside */}
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
        Transparent sprite container — no border, no background, no shadow.
        Three layers: pointer target → weight scaleX → bounce scaleY
      */}
      <div
        className="char-sprite-outer"
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
              imgSrc ? (
                <img src={imgSrc} alt="gravestone" className="char-sprite-img"
                  onError={ev => { (ev.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <div className="char-placeholder" style={{ background: '#D4CFC7' }} />
              )
            )}
          </div>
        </div>
      </div>

      <div className="char-label-group">
        <div className="char-name">{name}</div>
        {!char.alive ? (
          <div className="char-dead-label">RIP {name}</div>
        ) : (
          <>
            <div className="char-info">Lv.{char.level} {char.age}</div>
            <div className="xp-label">{char.xp} / {xpNeeded(char.age)} xp</div>
          </>
        )}
      </div>
    </div>
  )
}
