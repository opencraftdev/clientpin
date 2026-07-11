'use client'
import { useState, useTransition } from 'react'
import { verifyPassword } from '../actions'

export function PasswordGate({ slug }: { slug: string }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(false); const [pending, start] = useTransition()
  return (
    <div className="grid-paper grid min-h-screen place-items-center px-6">
      <form className="reg-marks w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-card"
        onSubmit={(e) => { e.preventDefault(); start(async () => { const ok = await verifyPassword(slug, pw); if (!ok) setErr(true) }) }}>
        <span aria-hidden className="mx-auto grid h-12 w-12 place-items-center text-pin">
          <svg width="30" height="40" viewBox="0 0 24 32" aria-hidden><path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="currentColor" /><circle cx="12" cy="12" r="4.4" fill="var(--color-surface)" /></svg>
        </span>
        <h1 className="font-display mt-4 text-[1.375rem] font-bold tracking-tight text-ink">This project is protected</h1>
        <p className="mt-1.5 text-[0.9375rem] text-ink-dim">Enter the password to view it.</p>
        <input type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setErr(false) }}
          className="ring-accent mt-6 w-full rounded-xl border border-line bg-surface px-3 py-3 text-center text-[0.9375rem] transition-colors focus:border-accent focus:outline-none" placeholder="Password" />
        {err && <p className="mt-2 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>Incorrect password.</p>}
        <button disabled={pending} className="ring-accent mt-4 w-full rounded-xl bg-accent px-4 py-3 text-[0.9375rem] font-semibold text-accent-ink shadow-bar transition-colors hover:bg-accent-press disabled:opacity-60">
          {pending ? 'Checking…' : 'View project'}
        </button>
      </form>
    </div>
  )
}
