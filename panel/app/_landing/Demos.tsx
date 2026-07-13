import type { ReactNode } from 'react'
import { Pin, StatusChip, Thumb } from './parts'
import { CopyPrompt } from './CopyPrompt'

/* ---------- Reusable browser chrome ---------- */
export function BrowserFrame({ url, children, className = '' }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-line bg-surface ${className}`}>
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="font-code ml-3 truncate rounded-md bg-bg px-3 py-1 text-[0.7rem] text-ink-mute">{url}</span>
      </div>
      {children}
    </div>
  )
}

/* ---------- Comment bubble attached to a pin ---------- */
function Bubble() {
  return (
    <div className="w-56 rounded-xl border border-line bg-surface p-3 shadow-lift">
      <div className="flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[0.6rem] font-bold text-accent-ink">Q</span>
        <span className="text-[0.75rem] font-semibold text-ink">QA lead</span>
        <span className="ml-auto"><StatusChip status="new" /></span>
      </div>
      <p className="mt-2 text-[0.8125rem] leading-snug text-ink">Button text overflows on mobile.</p>
      <p className="font-code mt-1.5 text-[0.65rem] text-ink-mute">/checkout · &lt;button.cta&gt;</p>
    </div>
  )
}

/* ---------- HERO: tag mode in action on a live site ---------- */
export function TagDemo() {
  return (
    <BrowserFrame url="acme.store/checkout" className="border-ink shadow-edge">
      <div className="relative overflow-hidden">
        {/* dimmed live site underneath (tag mode) */}
        <div className="select-none p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-md bg-line-2" /><span className="h-2.5 w-16 rounded-full bg-line-2" /></div>
            <div className="hidden gap-4 sm:flex">{[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-10 rounded-full bg-line" />)}</div>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-[1.3fr_1fr]">
            <div className="space-y-3">
              <div className="h-3.5 w-4/5 rounded-full bg-line-2" />
              <div className="h-3.5 w-3/5 rounded-full bg-line" />
              <div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-2.5 w-full rounded-full bg-line" style={{ width: `${90 - i * 15}%` }} />)}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="h-16 w-full rounded-lg bg-line" />
              <div className="mt-3 h-2.5 w-2/3 rounded-full bg-line-2" />
              <div className="mt-2 h-2.5 w-1/2 rounded-full bg-line" />
              <div className="mt-4 h-8 w-full rounded-lg bg-line-2" />
            </div>
          </div>
        </div>
        {/* dim overlay */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/45" />

        {/* the highlighted element, lit above the dim */}
        <div className="absolute left-6 bottom-6 z-10 sm:left-8 sm:bottom-8">
          <div className="relative w-fit rounded-lg outline outline-2 outline-offset-4" style={{ outlineColor: 'var(--color-accent)' }}>
            <span className="inline-block rounded-lg bg-accent px-8 py-2.5 text-[0.8rem] font-semibold text-accent-ink shadow-bar">Checkout now</span>
            <span className="absolute -right-3 -top-5"><Pin size={22} /></span>
          </div>
        </div>
        {/* bubble */}
        <div className="absolute right-5 top-6 z-10 hidden sm:block"><Bubble /></div>
      </div>
    </BrowserFrame>
  )
}

/* ---------- Pipeline: click → capture → share ---------- */
export function Pipeline() {
  const Arrow = () => <span className="hidden text-ink-mute sm:inline" aria-hidden>→</span>
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
      {/* 1 — click */}
      <div className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
        <span className="font-code text-[0.7rem] font-semibold uppercase tracking-wide text-accent">01 · Click</span>
        <p className="mt-1 text-[0.9rem] font-semibold text-ink">Point at the element</p>
        <div className="mt-4 flex flex-1 items-center justify-center rounded-xl bg-surface-2 py-6">
          <div className="relative w-fit rounded-md outline outline-2 outline-offset-2" style={{ outlineColor: 'var(--color-accent)' }}>
            <span className="rounded-md bg-accent px-4 py-1.5 text-[0.7rem] font-semibold text-accent-ink">Checkout</span>
            <span className="absolute -right-2.5 -top-4"><Pin size={16} /></span>
          </div>
        </div>
      </div>
      <div className="grid place-items-center"><Arrow /></div>
      {/* 2 — capture */}
      <div className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
        <span className="font-code text-[0.7rem] font-semibold uppercase tracking-wide text-accent">02 · Capture</span>
        <p className="mt-1 text-[0.9rem] font-semibold text-ink">Screenshot + location</p>
        <div className="mt-4 flex flex-1 items-center justify-center rounded-xl bg-surface-2 py-6"><Thumb kind="button" /></div>
      </div>
      <div className="grid place-items-center"><Arrow /></div>
      {/* 3 — share */}
      <div className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
        <span className="font-code text-[0.7rem] font-semibold uppercase tracking-wide text-accent">03 · Share</span>
        <p className="mt-1 text-[0.9rem] font-semibold text-ink">One list, one link</p>
        <div className="mt-4 flex flex-1 flex-col justify-center gap-1.5 rounded-xl bg-surface-2 p-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2 py-1.5">
              <span className="h-4 w-6 rounded bg-line" /><span className="h-1.5 flex-1 rounded-full bg-line" />
              <span className="h-1.5 w-7 rounded-full" style={{ background: i ? 'var(--color-resolved)' : 'var(--color-new)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Showcase: jump to the live element ---------- */
export function LocateShot() {
  return (
    <BrowserFrame url="acme.store/checkout" className="shadow-card">
      <div className="relative p-5">
        <div className="space-y-2.5">
          <div className="h-2.5 w-1/3 rounded-full bg-line" />
          <div className="h-2.5 w-2/3 rounded-full bg-line" />
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-dashed p-3" style={{ borderColor: 'var(--color-accent)' }}>
          <span className="text-accent"><Pin size={18} /></span>
          <span className="rounded-md bg-accent px-4 py-1.5 text-[0.72rem] font-semibold text-accent-ink">Checkout now</span>
          <span className="font-code ml-auto text-[0.65rem] text-ink-mute">scrolled into view</span>
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="h-2.5 w-1/2 rounded-full bg-line" />
          <div className="h-2.5 w-3/5 rounded-full bg-line" />
        </div>
      </div>
    </BrowserFrame>
  )
}

/* ---------- Showcase: status + AI-fix prompt ---------- */
const PROMPT = `Fix this UI issue on /checkout:
Problem: "Button text overflows on mobile"
Element: <button.cta>
Screenshot + selector attached.`

export function FixShot() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <Thumb kind="button" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.85rem] font-medium text-ink">Button text overflows on mobile</p>
          <p className="font-code mt-0.5 text-[0.65rem] text-ink-mute">/checkout · &lt;button.cta&gt;</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusChip status="new" /><span className="text-ink-mute" aria-hidden>→</span>
        <StatusChip status="in_progress" /><span className="text-ink-mute" aria-hidden>→</span><StatusChip status="resolved" />
      </div>
      <div className="mt-4 rounded-xl border border-line bg-bg p-3">
        <div className="flex items-center justify-between">
          <span className="font-code text-[0.65rem] font-semibold uppercase tracking-wide text-accent">AI fix prompt</span>
          <CopyPrompt text={PROMPT} />
        </div>
        <pre className="font-code mt-2 overflow-hidden whitespace-pre-wrap text-[0.68rem] leading-relaxed text-ink-dim">{PROMPT}</pre>
      </div>
    </div>
  )
}

/* ---------- Showcase: private link, gone in 7 days ---------- */
export function ShareShot() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="font-code flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2.5 text-[0.75rem]">
        <span className="text-ink-mute">clientpin.app/</span><span className="text-accent">HDc7dS5F2s</span>
        <span className="ml-auto rounded-md bg-surface-2 px-2 py-0.5 text-[0.62rem] text-ink-mute">copy</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[0.72rem] text-ink-dim">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          Password protected
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-medium" style={{ backgroundColor: 'var(--color-resolved-soft)', color: 'var(--color-resolved)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></svg>
          Expires in 7 days
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[0.72rem] text-ink-dim">No account for viewers</span>
      </div>
    </div>
  )
}
