'use client'
import { useState, useTransition } from 'react'
import { verifyPassword } from '../actions'

export function PasswordGate({ slug }: { slug: string }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(false); const [pending, start] = useTransition()
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <form className="w-full max-w-sm text-center"
        onSubmit={(e) => { e.preventDefault(); start(async () => { const ok = await verifyPassword(slug, pw); if (!ok) setErr(true) }) }}>
        <span className="mx-auto mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-ink shadow-bar text-[1.1rem] font-bold">C</span>
        <h1 className="text-[1.25rem] font-semibold text-ink">This project is protected</h1>
        <p className="mt-1 text-[0.875rem] text-ink-dim">Enter the password to view it.</p>
        <input type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setErr(false) }}
          className="ring-accent mt-5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-center text-[0.9375rem] focus:border-accent focus:outline-none" placeholder="Password" />
        {err && <p className="mt-2 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>Incorrect password.</p>}
        <button disabled={pending} className="ring-accent mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-[0.9375rem] font-semibold text-accent-ink shadow-bar disabled:opacity-60">
          {pending ? 'Checking…' : 'View project'}
        </button>
      </form>
    </div>
  )
}
