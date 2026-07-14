'use client'
import { useEffect, useState } from 'react'
import { InstallSteps, DownloadButton } from '../_landing/InstallSteps'

// The QA-pins empty state, gated on the extension. Detects the ClientPin
// extension over the same window.postMessage handshake the content script
// answers (see extension/src/content.tsx):
//   not installed → download + install steps
//   detected      → Connect button (binds this browser to the project)
//   connected     → prompt to open the site and tag
type State = 'checking' | 'absent' | 'present' | 'connecting' | 'connected' | 'error'

function PinIcon() {
  return (
    <svg width="26" height="34" viewBox="0 0 24 32" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="currentColor" />
      <circle cx="12" cy="12" r="4.4" fill="var(--color-surface)" />
    </svg>
  )
}

export function QAEmptyState({ projectKey, slug, name }: { projectKey: string; slug: string; name: string }) {
  const [state, setState] = useState<State>('checking')
  const [err, setErr] = useState('')

  useEffect(() => {
    let settled = false
    const onMsg = (e: MessageEvent) => {
      const d = e.data
      if (e.source !== window || !d || d.source !== 'clientpin-ext') return
      if (d.type !== 'pong' && d.type !== 'hello') return
      settled = true
      setState(d.activeSlug === slug ? 'connected' : 'present')
    }
    window.addEventListener('message', onMsg)
    const ping = () => window.postMessage({ source: 'clientpin-page', type: 'ping' }, '*')
    ping()
    const iv = setInterval(() => (settled ? clearInterval(iv) : ping()), 250)
    const t = setTimeout(() => { clearInterval(iv); if (!settled) setState('absent') }, 2500)
    return () => { window.removeEventListener('message', onMsg); clearInterval(iv); clearTimeout(t) }
  }, [slug])

  const connect = () => {
    setState('connecting'); setErr('')
    const onMsg = (e: MessageEvent) => {
      const d = e.data
      if (e.source !== window || !d || d.source !== 'clientpin-ext' || d.type !== 'connected') return
      window.removeEventListener('message', onMsg)
      if (d.ok) setState('connected')
      else { setErr(d.error || 'Could not connect'); setState('error') }
    }
    window.addEventListener('message', onMsg)
    window.postMessage({ source: 'clientpin-page', type: 'connect', projectKey, slug, name }, '*')
    setTimeout(() => {
      window.removeEventListener('message', onMsg)
      setState((s) => (s === 'connecting' ? 'error' : s))
    }, 5000)
  }

  const detected = state === 'present' || state === 'connecting' || state === 'error'

  return (
    <div className="mt-5 border border-dashed border-line-2 px-6 py-10">
      <div className="text-center">
        <span className="mx-auto text-pin" style={{ display: 'inline-block' }}><PinIcon /></span>
        <p className="mt-3 text-[0.9375rem] font-semibold text-ink">No QA pins yet</p>

        {state === 'checking' && (
          <p className="mt-1 flex items-center justify-center gap-2 text-[0.8125rem] text-ink-mute">
            <span className="h-2 w-2 animate-pulse rounded-full bg-line-2" /> Checking for the ClientPin extension…
          </p>
        )}
        {state === 'absent' && (
          <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] leading-relaxed text-ink-dim">Haven&apos;t installed the extension yet? It takes about a minute, works in any Chromium browser (Chrome, Edge, Brave, Arc), and is not on the Web Store yet, so you install it directly.</p>
        )}
        {detected && (
          <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] leading-relaxed text-ink-dim">Extension detected. Connect this project to start tagging on your site.</p>
        )}
        {state === 'connected' && (
          <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] leading-relaxed text-ink-dim">Connected. Open your site and turn on <b className="font-semibold text-ink">Tag mode</b> to add your first pin.</p>
        )}

        {state === 'absent' && <div className="mt-5 flex justify-center"><DownloadButton /></div>}
        {detected && (
          <div className="mt-5 flex flex-col items-center gap-2">
            <button type="button" onClick={connect} disabled={state === 'connecting'}
              className="ring-accent shadow-edge inline-flex items-center gap-2 bg-accent px-6 py-2.5 text-[0.875rem] font-semibold text-accent-ink transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none disabled:opacity-60">
              {state === 'connecting' ? 'Connecting…' : 'Connect'}
            </button>
            {err && <p className="text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>{err}</p>}
          </div>
        )}
      </div>

      {state === 'absent' && (
        <div className="mx-auto mt-8 max-w-md">
          <p className="font-code mb-3 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-mute">Then, in your browser</p>
          <InstallSteps />
        </div>
      )}
    </div>
  )
}
