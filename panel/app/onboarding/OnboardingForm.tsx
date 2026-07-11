'use client'
import { useState, useTransition } from 'react'
import { createProject, type Milestone } from './actions'
import { CopyField } from './CopyField'

const field = 'ring-accent w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[0.875rem] transition-colors focus:border-accent focus:outline-none'
const labelText = 'text-[0.75rem] font-semibold uppercase tracking-wide text-ink-dim'

// ponytail: module-scope counter; deterministic 'm0' for initial SSR row, crypto.randomUUID() only at click time
let seq = 0
const nextId = () => `m${++seq}`

type MilestoneRow = Milestone & { id: string }

export function OnboardingForm() {
  const [name, setName] = useState(''); const [desc, setDesc] = useState('')
  const [github, setGithub] = useState(''); const [site, setSite] = useState(''); const [pw, setPw] = useState('')
  const [milestones, setMilestones] = useState<MilestoneRow[]>([{ id: 'm0', name: '', status: 'waiting' }])
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ slug: string; project_key: string } | null>(null)
  const [err, setErr] = useState('')

  if (result) {
    // Derive the base from the browser so the link is correct on any host with no env config.
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-resolved-soft text-resolved">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l4.5 4.5L19 7" /></svg>
          </span>
          <h2 className="font-display text-[1.375rem] font-bold tracking-tight text-ink">Project created</h2>
        </div>
        <p className="text-[0.9375rem] text-ink-dim">Share the link (with the password) and give the connect code to whoever installs the extension.</p>
        <CopyField label="Public link" value={`${base}/${result.slug}`} />
        <CopyField label="Connect code (for the extension)" value={result.project_key} />
      </div>
    )
  }

  const submit = () => {
    setErr('')
    if (!name.trim() || !pw.trim()) { setErr('Name and password are required.'); return }
    const ms = milestones.filter((m) => m.name.trim()).map(({ name, status }) => ({ name, status }))
    start(async () => {
      try { setResult(await createProject({ name: name.trim(), description: desc.trim(), github_link: github.trim(), site_url: site.trim(), milestones: ms, view_password: pw })) }
      catch (e) { setErr((e as Error).message) }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1"><span className={labelText}>Project name *</span>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Store" /></label>
      <label className="flex flex-col gap-1"><span className={labelText}>Description</span>
        <textarea className={field} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this project?" /></label>

      <div>
        <span className={labelText}>Milestones (optional)</span>
        <div className="mt-1 flex flex-col gap-2">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex gap-2">
              <input className={field} value={m.name} placeholder={`Milestone ${i + 1}`}
                onChange={(e) => setMilestones(milestones.map((x) => x.id === m.id ? { ...x, name: e.target.value } : x))} />
              <select className="ring-accent rounded-xl border border-line bg-surface px-2 text-[0.8125rem]" value={m.status}
                onChange={(e) => setMilestones(milestones.map((x) => x.id === m.id ? { ...x, status: e.target.value as Milestone['status'] } : x))}>
                <option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="done">Done</option>
              </select>
              <button type="button" className="px-2 text-ink-mute hover:text-ink" onClick={() => setMilestones(milestones.filter((x) => x.id !== m.id))}>×</button>
            </div>
          ))}
          <button type="button" className="w-fit text-[0.8125rem] font-medium text-accent" onClick={() => setMilestones([...milestones, { id: nextId(), name: '', status: 'waiting' }])}>+ Add milestone</button>
        </div>
      </div>

      <label className="flex flex-col gap-1"><span className={labelText}>GitHub link (optional)</span>
        <input className={field} value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." /></label>
      <label className="flex flex-col gap-1"><span className={labelText}>Site URL (optional)</span>
        <input className={field} value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://acme.store" /></label>
      <label className="flex flex-col gap-1"><span className={labelText}>View password *</span>
        <input className={field} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Clients enter this to view the link" /></label>

      {err && <p className="text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>{err}</p>}
      <button onClick={submit} disabled={pending}
        className="ring-accent mt-1 rounded-xl bg-accent px-5 py-3 text-[0.9375rem] font-semibold text-accent-ink shadow-bar transition-colors hover:bg-accent-press disabled:opacity-60">
        {pending ? 'Creating…' : 'Create project'}
      </button>
    </div>
  )
}
