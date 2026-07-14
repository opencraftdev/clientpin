'use client'
import { useEffect, useState } from 'react'
import { DOWNLOAD_URL } from '../_landing/InstallSteps'

// Talks to the ClientPin extension's content script over window.postMessage
// (see extension/src/content.tsx). No manual connect-code paste: detect the
// extension, then hand it the project_key so tag mode is ready immediately.
type State = 'checking' | 'absent' | 'present' | 'connecting' | 'connected' | 'error'

const dotClass = { absent: 'bg-[var(--color-danger)]', present: 'bg-accent', connected: 'bg-resolved' }

export function ExtensionConnect({ projectKey, slug, name }: { projectKey: string; slug: string; name: string }) {
  const [state, setState] = useState<State>('checking')
  const [err, setErr] = useState('')

  // Detect on mount: ping, wait for a pong, else assume not installed.
  useEffect(() => {
    let settled = false
    const onMsg = (e: MessageEvent) => {
      const d = e.data
      if (e.source !== window || !d || d.source !== 'clientpin-ext' || d.type !== 'pong') return
      settled = true
      setState(d.activeSlug === slug ? 'connected' : 'present')
    }
    window.addEventListener('message', onMsg)
    window.postMessage({ source: 'clientpin-page', type: 'ping' }, '*')
    const t = setTimeout(() => { if (!settled) setState('absent') }, 700)
    return () => { window.removeEventListener('message', onMsg); clearTimeout(t) }
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

  return (
    <div className="mt-7 border-t border-line pt-5">
      <h2 className="font-code text-[0.7rem] font-semibold uppercase tracking-wide text-ink-dim">Tag mode</h2>

      {state === 'checking' && (
        <p className="mt-2.5 flex items-center gap-2 text-[0.875rem] text-ink-mute">
          <span className="h-2 w-2 animate-pulse rounded-full bg-line-2" /> Checking for the ClientPin extension…
        </p>
      )}

      {state === 'absent' && (
        <div className="mt-2.5">
          <p className="flex items-center gap-2 text-[0.875rem] font-semibold text-ink">
            <span className={`h-2 w-2 rounded-full ${dotClass.absent}`} /> Extension not installed
          </p>
          <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-ink-dim">Install the ClientPin extension, then reload this page to connect. No connect code to copy.</p>
          <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer" className="ring-accent mt-3 inline-flex items-center gap-2 border border-line bg-surface px-4 py-2 text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-surface-2">Download extension</a>
        </div>
      )}

      {(state === 'present' || state === 'connecting' || state === 'error') && (
        <div className="mt-2.5">
          <p className="flex items-center gap-2 text-[0.875rem] font-semibold text-ink">
            <span className={`h-2 w-2 rounded-full ${dotClass.present}`} /> Extension detected
          </p>
          <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-ink-dim">Connect this project to start tagging on your site.</p>
          <button type="button" onClick={connect} disabled={state === 'connecting'}
            className="ring-accent mt-3 inline-flex items-center gap-2 bg-accent px-4 py-2 text-[0.8125rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press disabled:opacity-60">
            {state === 'connecting' ? 'Connecting…' : 'Connect'}
          </button>
          {err && <p className="mt-2 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>{err}</p>}
        </div>
      )}

      {state === 'connected' && (
        <div className="mt-2.5">
          <p className="flex items-center gap-2 text-[0.875rem] font-semibold text-ink">
            <span className={`h-2 w-2 rounded-full ${dotClass.connected}`} /> Connected, tag mode is ready
          </p>
          <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-ink-dim">Open your site and use “Tag mode” from the ClientPin button to pin issues.</p>
        </div>
      )}
    </div>
  )
}
