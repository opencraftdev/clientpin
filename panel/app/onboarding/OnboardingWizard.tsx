'use client'
import { useState, useTransition } from 'react'
import { createProject } from './actions'
import { CopyField } from './CopyField'
import { Logo } from '../_landing/parts'

const field = 'ring-accent w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[0.875rem] transition-colors focus:border-accent focus:outline-none'
const labelText = 'text-[0.72rem] font-semibold uppercase tracking-wide text-ink-dim'

// Links are optional, but a filled one must be a real URL. Accept scheme-less
// domains (acme.store) by prefixing https://; reject bare words like "test".
const normLink = (v: string) => { const s = v.trim(); return s ? (/^https?:\/\//i.test(s) ? s : `https://${s}`) : '' }
const linkOk = (v: string) => { const s = v.trim(); if (!s) return true; try { return new URL(normLink(s)).hostname.includes('.') } catch { return false } }

const STEPS = [
  { key: 'project', label: 'Project', title: 'Name your project', desc: 'What are we building? A clear name and a line of context for whoever opens the link.' },
  { key: 'links', label: 'Links', title: 'Link the work', desc: 'Where is the site you are testing? Tag mode runs only on this site. The repo is optional.' },
  { key: 'access', label: 'Access', title: 'Set a view password', desc: 'Viewers open the public link and enter this password. No accounts, ever.' },
] as const

function ProgressRing({ value, total }: { value: number; total: number }) {
  const r = 15, c = 2 * Math.PI * r
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0" aria-hidden>
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-line)" strokeWidth="3.5" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-accent)" strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / total)} transform="rotate(-90 20 20)"
        style={{ transition: 'stroke-dashoffset 0.45s cubic-bezier(0.16,1,0.3,1)' }} />
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central" className="font-code" fontSize="9.5" fontWeight="600" fill="var(--color-ink-dim)">{value}/{total}</text>
    </svg>
  )
}

function Check() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l4.5 4.5L19 7" /></svg>
}

function StepList({ step, maxReached, go }: { step: number; maxReached: number; go: (i: number) => void }) {
  return (
    <ol className="relative mt-6 flex flex-col gap-1">
      <span aria-hidden className="absolute left-[27px] top-8 bottom-8 w-px -translate-x-1/2 bg-line-2" />
      {STEPS.map((s, i) => {
        const state = i < step ? 'done' : i === step ? 'active' : 'upcoming'
        const clickable = i <= maxReached && i !== step
        const token = state === 'done'
          ? 'bg-accent text-accent-ink'
          : state === 'active' ? 'bg-ink text-surface' : 'border border-line-2 bg-surface text-ink-mute'
        return (
          <li key={s.key}>
            <button type="button" disabled={!clickable} onClick={() => clickable && go(i)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${state === 'active' ? 'bg-accent-soft' : clickable ? 'hover:bg-surface-2' : ''} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}>
              <span className={`font-code relative z-10 grid h-8 w-8 shrink-0 place-items-center text-[0.72rem] font-semibold ${token}`}>
                {state === 'done' ? <Check /> : `0${i + 1}`}
              </span>
              <span className={`flex-1 text-[0.875rem] ${state === 'active' ? 'font-semibold text-ink' : state === 'done' ? 'font-medium text-ink-dim' : 'text-ink-mute'}`}>{s.label}</span>
              {state === 'active' && <span className="text-accent" aria-hidden>›</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function OnboardingWizard({ email }: { email?: string }) {
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [name, setName] = useState(''); const [desc, setDesc] = useState('')
  const [github, setGithub] = useState(''); const [site, setSite] = useState(''); const [pw, setPw] = useState('')
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ slug: string; project_key: string } | null>(null)
  const [err, setErr] = useState('')

  const last = STEPS.length - 1
  const githubOk = linkOk(github)
  const siteOk = site.trim().length > 0 && linkOk(site) // site is required
  const canContinue = step === 0 ? name.trim().length > 0 : step === 1 ? githubOk && siteOk : step === last ? pw.trim().length > 0 : true
  const go = (i: number) => { setErr(''); setStep(i); setMaxReached((m) => Math.max(m, i)) }

  const submit = () => {
    setErr('')
    if (!name.trim() || !site.trim() || !pw.trim()) { setErr('A project name, site URL, and view password are required.'); return }
    start(async () => {
      try { setResult(await createProject({ name: name.trim(), description: desc.trim(), github_link: normLink(github), site_url: normLink(site), milestones: [], view_password: pw })) }
      catch (e) { setErr((e as Error).message) }
    })
  }

  const next = () => {
    if (step < last) go(step + 1)
    else submit()
  }

  // ── Share screen ──────────────────────────────────────────
  if (result) {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return (
      <div className="grid-paper grid min-h-screen place-items-center px-6">
        <div className="reg-marks w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-card">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-resolved-soft text-resolved"><Check /></span>
            <h2 className="font-display text-[1.5rem] font-bold tracking-tight text-ink">Project created</h2>
          </div>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-dim">Share the link and its password with whoever needs it. They install the extension, open the link, and click Connect. No code to copy.</p>
          <div className="mt-6 flex flex-col gap-4">
            <CopyField label="Public link" value={`${base}/${result.slug}`} />
          </div>
          <a href={`/${result.slug}`} className="ring-accent mt-6 flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-[0.9375rem] font-semibold text-accent-ink shadow-bar transition-colors hover:bg-accent-press">Open the dashboard →</a>
        </div>
      </div>
    )
  }

  const active = STEPS[step]

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Stepper rail */}
      <aside className="flex shrink-0 flex-col border-b border-line bg-surface px-6 py-6 md:w-[300px] md:border-b-0 md:border-r md:px-7 md:py-8">
        <div className="flex items-center justify-between">
          <Logo size={24} />
          <ProgressRing value={step + 1} total={STEPS.length} />
        </div>
        <div className="mt-6 hidden md:block">
          <h1 className="font-display text-[1.25rem] font-bold tracking-tight text-ink">Set up your project</h1>
          <p className="mt-1 text-[0.8125rem] text-ink-dim">Client workspace setup</p>
        </div>
        <div className="hidden md:block"><StepList step={step} maxReached={maxReached} go={go} /></div>
        <div className="mt-auto hidden pt-8 md:block">
          {email && <p className="font-code truncate text-[0.72rem] text-ink-mute">{email}</p>}
          <a href="/" className="mt-1 inline-block text-[0.8125rem] text-ink-dim transition-colors hover:text-ink">Save and exit</a>
        </div>
      </aside>

      {/* Step pane */}
      <main className="grid-paper flex min-w-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 md:px-10 md:py-14">
          <p className="font-code text-[0.75rem] font-semibold uppercase tracking-wide text-accent">Step {step + 1} / {STEPS.length}</p>
          <h2 className="font-display mt-2 text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-ink">{active.title}</h2>
          <p className="mt-2 max-w-lg text-[0.9375rem] leading-relaxed text-ink-dim">{active.desc}</p>

          <div className="mt-7 rounded-2xl border border-line bg-surface p-6 shadow-card">
            {step === 0 && (
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1.5"><span className={labelText}>Project name *</span>
                  <input autoFocus className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Store" /></label>
                <label className="flex flex-col gap-1.5"><span className={labelText}>Description</span>
                  <textarea className={field} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this project?" /></label>
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1.5"><span className={labelText}>GitHub link</span>
                  <input type="url" inputMode="url" className={field} style={!githubOk ? { borderColor: 'var(--color-danger)' } : undefined} value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
                  {!githubOk && <span className="text-[0.75rem]" style={{ color: 'var(--color-danger)' }}>Enter a valid URL, e.g. https://github.com/acme/store</span>}</label>
                <label className="flex flex-col gap-1.5"><span className={labelText}>Site URL *</span>
                  <input type="url" inputMode="url" className={field} style={site.trim() && !linkOk(site) ? { borderColor: 'var(--color-danger)' } : undefined} value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://acme.store" />
                  {site.trim() && !linkOk(site)
                    ? <span className="text-[0.75rem]" style={{ color: 'var(--color-danger)' }}>Enter a valid URL, e.g. https://acme.store</span>
                    : <span className="text-[0.75rem] text-ink-mute">Required. Tag mode runs only on this site.</span>}</label>
              </div>
            )}

            {step === 2 && (
              <label className="flex flex-col gap-1.5"><span className={labelText}>View password *</span>
                <input autoFocus className={field} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Clients enter this to view the link"
                  onKeyDown={(e) => { if (e.key === 'Enter' && canContinue && !pending) submit() }} />
                <span className="text-[0.75rem] text-ink-mute">Anyone with the link and this password can view and update the project.</span>
              </label>
            )}
          </div>

          {err && <p className="mt-4 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>{err}</p>}

          {/* Bottom nav */}
          <div className="mt-auto flex items-center justify-between pt-10">
            <button type="button" onClick={() => go(step - 1)} disabled={step === 0}
              className="ring-accent grid h-11 w-11 place-items-center border border-ink bg-surface text-ink transition-colors hover:bg-ink hover:text-bg disabled:invisible" aria-label="Back">‹</button>
            <button type="button" onClick={next} disabled={!canContinue || pending}
              className="ring-accent inline-flex items-center gap-2 bg-accent px-6 py-3 text-[0.9375rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press disabled:cursor-not-allowed disabled:opacity-45">
              {step < last ? 'Continue →' : pending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
