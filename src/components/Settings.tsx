import { useState, useEffect } from 'react'

interface Props {
  calorieGoal: number
  activityGoal: number
  onSave: (calorieGoal: number, activityGoal: number) => void
  onReset: () => void
  onClose: () => void
}

export function Settings({ calorieGoal, activityGoal, onSave, onReset, onClose }: Props) {
  const [calories, setCalories] = useState(String(calorieGoal))
  const [activity, setActivity] = useState(String(activityGoal))
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => { setCalories(String(calorieGoal)) }, [calorieGoal])
  useEffect(() => { setActivity(String(activityGoal)) }, [activityGoal])

  function handleSave() {
    const cal = parseInt(calories, 10)
    const act = parseInt(activity, 10)
    if (isNaN(cal) || cal <= 0 || isNaN(act) || act <= 0) {
      setError('both goals must be > 0')
      return
    }
    setError('')
    onSave(cal, act)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="popup-outer popup-settings">
      <div className="popup-mid">
        <div className="popup-inner">
          <div className="popup-title">Settings</div>

          <div className="settings-form">
            <div className="settings-field">
              <span className="settings-label">Daily Calorie Goal</span>
              <div className="popup-input-wrap">
                <input
                  className="popup-input"
                  type="number"
                  min={1}
                  value={calories}
                  onChange={e => { setCalories(e.target.value); setError('') }}
                />
                <span className="popup-input-unit">kcal</span>
              </div>
            </div>

            <div className="settings-field">
              <span className="settings-label">Daily Activity Goal</span>
              <div className="popup-input-wrap">
                <input
                  className="popup-input"
                  type="number"
                  min={1}
                  value={activity}
                  onChange={e => { setActivity(e.target.value); setError('') }}
                />
                <span className="popup-input-unit">min</span>
              </div>
            </div>

            {error && <div className="popup-error">{error}</div>}

            <div className="popup-form-actions">
              <button className="pixel-btn btn-activity" onClick={handleSave}>Save</button>
              <button className="pixel-btn btn-settings" onClick={onClose}>Close</button>
            </div>

            {saved && <div className="settings-saved">Saved!</div>}
          </div>

          <div className="settings-separator" />

          <div className="settings-danger-label">Danger Zone</div>

          {!confirmReset ? (
            <button className="pixel-btn btn-danger" onClick={() => setConfirmReset(true)}>
              Reset Game
            </button>
          ) : (
            <div className="settings-confirm">
              <div className="settings-confirm-msg">Are you sure? This resets everything.</div>
              <div className="popup-form-actions">
                <button className="pixel-btn btn-danger" onClick={onReset}>Yes, Reset</button>
                <button className="pixel-btn btn-settings" onClick={() => setConfirmReset(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
