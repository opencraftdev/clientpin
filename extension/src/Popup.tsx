import { useEffect, useState } from 'react'
import './popup.css'
import { connectProject } from './supabase'
import { getActive, addProject, type Project } from './projects'

export function Popup() {
  const [active, setActive] = useState<Project | null>(null)
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')

  useEffect(() => { getActive().then(setActive) }, [])

  const connect = async () => {
    if (!code.trim()) return
    setBusy(true); setErr('')
    try { const p = await connectProject(code.trim()); await addProject(p); setActive(p); setCode('') }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="qa-popup">
      <header className="qa-head">
        <span className="qa-mark">C</span>
        <div><div className="qa-title">ClientPin</div><div className="qa-sub">{active ? `Connected: ${active.name}` : 'Element detector'}</div></div>
      </header>
      {active ? (
        <div className="qa-saved show">Connected. Use “Tag mode” on your site.</div>
      ) : (
        <>
          <p className="qa-hint">Open your ClientPin list and click <b>Connect</b> in Basic info. No code to copy.</p>
          <details className="qa-more">
            <summary>Paste a connect code instead</summary>
            <label className="qa-field"><span className="qa-label">Connect code</span>
              <input className="qa-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code from your dashboard" spellCheck={false} /></label>
            {err && <div className="qa-saved show" style={{ color: 'var(--danger, #c0392b)' }}>{err}</div>}
            <button className="qa-btn" onClick={connect} disabled={busy}>{busy ? 'Connecting…' : 'Connect'}</button>
          </details>
        </>
      )}
    </div>
  )
}
