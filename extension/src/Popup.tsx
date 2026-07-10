import { useEffect, useState } from 'react'
import { getKey, setKey } from './supabase'
import './popup.css'

export function Popup() {
  const [key, setLocal] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => { getKey().then((k) => k && setLocal(k)) }, [])

  const save = async () => {
    await setKey(key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="qa-popup">
      <header className="qa-head">
        <span className="qa-mark">Q</span>
        <div>
          <div className="qa-title">QA Tagger</div>
          <div className="qa-sub">Element tagging</div>
        </div>
      </header>

      <label className="qa-field">
        <span className="qa-label">Project key</span>
        <input
          className="qa-input"
          value={key}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Paste your project key"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>

      <button className="qa-btn" onClick={save}>Save</button>
      <div className={`qa-saved ${saved ? 'show' : ''}`} role="status">✓ Saved</div>
    </div>
  )
}
