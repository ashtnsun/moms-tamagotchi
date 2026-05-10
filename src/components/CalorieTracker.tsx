import { useState } from 'react'

interface CalorieEntry {
  name?: string
  amount: number
  timestamp: number
}

interface Props {
  log: CalorieEntry[]
  onLog: (amount: number, name?: string) => void
  onClose: () => void
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function CalorieTracker({ log, onLog, onClose }: Props) {
  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    const amount = parseInt(calories, 10)
    if (isNaN(amount) || amount <= 0) {
      setError('enter calories > 0')
      return
    }
    onLog(amount, foodName.trim() || undefined)
    setFoodName('')
    setCalories('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="popup-outer popup-calories">
      <div className="popup-mid">
        <div className="popup-inner popup-tracker">
          <div className="popup-title">Calorie Log</div>

          <div className="popup-log-list">
            {log.length === 0 ? (
              <div className="popup-log-empty">No entries yet</div>
            ) : (
              log.slice().reverse().map(entry => (
                <div key={entry.timestamp} className="popup-log-entry">
                  <span className="popup-log-name">{entry.name || '—'}</span>
                  <span className="popup-log-meta">
                    {entry.amount} cal &middot; {fmt(entry.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="popup-form">
            <input
              className="popup-input"
              type="text"
              placeholder="e.g. rice bowl"
              value={foodName}
              onChange={e => setFoodName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="popup-input-wrap">
              <input
                className="popup-input"
                type="number"
                placeholder="0"
                min={1}
                value={calories}
                onChange={e => { setCalories(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
              />
              <span className="popup-input-unit">kcal</span>
            </div>
            {error && <div className="popup-error">{error}</div>}
            <div className="popup-form-actions">
              <button className="pixel-btn btn-calories" onClick={handleSubmit}>Log</button>
              <button className="pixel-btn btn-settings" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
