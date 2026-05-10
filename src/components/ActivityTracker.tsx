import { useState } from 'react'

interface ActivityEntry {
  activity: string
  duration: number
  timestamp: number
}

interface Props {
  log: ActivityEntry[]
  onLog: (activity: string, duration: number) => void
  onClose: () => void
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ActivityTracker({ log, onLog, onClose }: Props) {
  const [activityName, setActivityName] = useState('')
  const [duration, setDuration] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    const mins = parseInt(duration, 10)
    if (isNaN(mins) || mins <= 0) {
      setError('enter duration > 0')
      return
    }
    onLog(activityName.trim() || 'activity', mins)
    setActivityName('')
    setDuration('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="popup-outer popup-activity">
      <div className="popup-mid">
        <div className="popup-inner popup-tracker">
          <div className="popup-title">Activity Log</div>

          <div className="popup-log-list">
            {log.length === 0 ? (
              <div className="popup-log-empty">No entries yet</div>
            ) : (
              log.slice().reverse().map(entry => (
                <div key={entry.timestamp} className="popup-log-entry">
                  <span className="popup-log-name">{entry.activity}</span>
                  <span className="popup-log-meta">
                    {entry.duration} min &middot; {fmt(entry.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="popup-form">
            <input
              className="popup-input"
              type="text"
              placeholder="e.g. walk"
              value={activityName}
              onChange={e => setActivityName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="popup-input-wrap">
              <input
                className="popup-input"
                type="number"
                placeholder="0"
                min={1}
                value={duration}
                onChange={e => { setDuration(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
              />
              <span className="popup-input-unit">min</span>
            </div>
            {error && <div className="popup-error">{error}</div>}
            <div className="popup-form-actions">
              <button className="pixel-btn btn-activity" onClick={handleSubmit}>Log</button>
              <button className="pixel-btn btn-settings" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
