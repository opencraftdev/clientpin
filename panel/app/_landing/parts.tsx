import type { ReactNode } from 'react'

/* ---------- Pin motif ---------- */
export function Pin({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={(size * 32) / 24} viewBox="0 0 24 32" className={className} aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="var(--color-pin)" />
      <circle cx="12" cy="12" r="4.4" fill="var(--color-surface)" />
    </svg>
  )
}

/* ---------- Logo (pin badge + wordmark) ---------- */
export function Logo({ size = 28, word = true }: { size?: number; word?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8.5" fill="var(--color-accent)" />
        <path d="M16 7c-3.4 0-6.2 2.7-6.2 6.1 0 4.4 6.2 10 6.2 10s6.2-5.6 6.2-10C22.2 9.7 19.4 7 16 7z" fill="var(--color-surface)" />
        <circle cx="16" cy="13" r="2.5" fill="var(--color-pin)" />
      </svg>
      {word && <span className="font-display text-[1.05rem] font-bold tracking-tight text-ink">ClientPin</span>}
    </span>
  )
}

/* ---------- Icons (stroke = currentColor) ---------- */
const S = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
export const IconCursor = () => (<svg {...S}><path d="M4 4l7 16 2.5-6.5L20 11z" /></svg>)
export const IconCamera = () => (<svg {...S}><path d="M4 8a2 2 0 0 1 2-2h1l1.2-1.6a1 1 0 0 1 .8-.4h6a1 1 0 0 1 .8.4L18 6h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.2" /></svg>)
export const IconLink = () => (<svg {...S}><path d="M9 15l6-6" /><path d="M10.5 6.5l1-1a4 4 0 0 1 6 6l-1 1" /><path d="M13.5 17.5l-1 1a4 4 0 0 1-6-6l1-1" /></svg>)
export const IconSparkle = () => (<svg {...S}><path d="M12 3l1.8 4.9L19 9.7l-4.9 1.8L12 16l-1.8-4.5L5 9.7l5.2-1.8z" /><path d="M18 15l.7 1.8L20.5 17l-1.8.7L18 19.5l-.7-1.8L15.5 17l1.8-.5z" /></svg>)
export const IconClock = () => (<svg {...S}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>)
export const IconDownload = () => (<svg {...S}><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>)
export const IconLocate = () => (<svg {...S}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>)
export const IconShield = () => (<svg {...S}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>)
export const IconCheck = () => (<svg {...S}><path d="M5 12l4.5 4.5L19 7" /></svg>)
export const IconImage = () => (<svg {...S}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 18l5-5 4 4 3-3 4 4" /></svg>)

/* ---------- Status chip ---------- */
const STATUS = {
  new: { label: 'New', color: 'var(--color-new)', soft: 'var(--color-new-soft)' },
  in_progress: { label: 'In progress', color: 'var(--color-progress)', soft: 'var(--color-progress-soft)' },
  resolved: { label: 'Resolved', color: 'var(--color-resolved)', soft: 'var(--color-resolved-soft)' },
} as const
type Status = keyof typeof STATUS

export function StatusChip({ status }: { status: Status }) {
  const m = STATUS[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-medium" style={{ backgroundColor: m.soft, color: m.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  )
}

/* ---------- Concrete "component screenshot" thumbnails ---------- */
export function Thumb({ kind }: { kind: 'button' | 'image' | 'text' }) {
  return (
    <div className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-bg">
      {kind === 'button' && <span className="rounded-md bg-accent px-3 py-1 text-[0.6rem] font-semibold text-accent-ink">Checkout</span>}
      {kind === 'image' && <span className="text-ink-mute" style={{ color: 'var(--color-new)' }}><IconImage /></span>}
      {kind === 'text' && (<div className="w-12 space-y-1"><div className="h-1.5 w-full rounded-full bg-line-2" /><div className="h-1.5 w-8 rounded-full bg-line" /></div>)}
    </div>
  )
}

/* ---------- The concrete product hero shot: a real list ---------- */
const ROWS: { kind: 'button' | 'image' | 'text'; comment: string; where: string; status: Status }[] = [
  { kind: 'button', comment: 'Button text overflows on mobile', where: '/checkout · <button.cta>', status: 'new' },
  { kind: 'image', comment: 'Logo looks blurry on retina screens', where: '/home · <img.logo>', status: 'in_progress' },
  { kind: 'text', comment: 'Footer links are too small to tap', where: '/about · <a.link>', status: 'resolved' },
]

export function ListPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      {/* browser bar */}
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="font-code ml-3 rounded-md bg-bg px-3 py-1 text-[0.7rem] text-ink-mute">clientpin.app/HDc7dS5F2s</span>
      </div>
      {/* list header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-[0.75rem] font-bold text-accent-ink">C</span>
          <div>
            <div className="text-[0.9375rem] font-semibold leading-none text-ink">Acme Store</div>
            <div className="font-code mt-1 text-[0.7rem] text-ink-mute">acme.store</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-[0.7rem] font-medium text-ink-dim">3 tags · expires in 6 days</span>
      </div>
      {/* rows */}
      <div className="mt-3 flex flex-col divide-y divide-line px-2 pb-3">
        {ROWS.map((r, i) => (
          <div key={i} className="flex items-center gap-3.5 px-3 py-3.5">
            <Thumb kind={r.kind} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.875rem] font-medium text-ink">{r.comment}</p>
              <p className="font-code mt-0.5 truncate text-[0.7rem] text-ink-mute">{r.where}</p>
            </div>
            <StatusChip status={r.status} />
            <span className="hidden shrink-0 rounded-full bg-accent-soft px-3 py-1 text-[0.7rem] font-semibold text-accent sm:inline">AI Fix</span>
          </div>
        ))}
      </div>
    </div>
  )
}
