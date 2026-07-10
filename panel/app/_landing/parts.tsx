import type { ReactNode } from 'react'

/* ---------- Pin motif ---------- */
export function Pin({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={(size * 32) / 24} viewBox="0 0 24 32" className={className} aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="var(--color-accent)" />
      <circle cx="12" cy="12" r="4.4" fill="var(--color-surface)" />
    </svg>
  )
}

/* ---------- Icons (24px, stroke = currentColor) ---------- */
const S = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
export const IconCursor = () => (<svg {...S}><path d="M4 4l7 16 2.5-6.5L20 11z" /></svg>)
export const IconCamera = () => (<svg {...S}><path d="M4 8a2 2 0 0 1 2-2h1l1.2-1.6a1 1 0 0 1 .8-.4h6a1 1 0 0 1 .8.4L18 6h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="12.5" r="3.2" /></svg>)
export const IconDatabase = () => (<svg {...S}><ellipse cx="12" cy="5.5" rx="7" ry="2.8" /><path d="M5 5.5v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" /><path d="M5 11.5v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" /></svg>)
export const IconLink = () => (<svg {...S}><path d="M9 15l6-6" /><path d="M10.5 6.5l1-1a4 4 0 0 1 6 6l-1 1" /><path d="M13.5 17.5l-1 1a4 4 0 0 1-6-6l1-1" /></svg>)
export const IconSparkle = () => (<svg {...S}><path d="M12 3l1.8 4.9L19 9.7l-4.9 1.8L12 16l-1.8-4.5L5 9.7l5.2-1.8z" /><path d="M18 15l.7 1.8L20.5 17l-1.8.7L18 19.5l-.7-1.8L15.5 17l1.8-.5z" /></svg>)
export const IconClock = () => (<svg {...S}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>)
export const IconDownload = () => (<svg {...S}><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>)
export const IconLocate = () => (<svg {...S}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>)
export const IconShield = () => (<svg {...S}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>)
export const IconCheck = () => (<svg {...S}><path d="M5 12l4.5 4.5L19 7" /></svg>)

/* ---------- Status chip ---------- */
const STATUS = {
  new: { label: 'New', color: 'var(--color-new)', soft: 'var(--color-new-soft)' },
  in_progress: { label: 'In progress', color: 'var(--color-progress)', soft: 'var(--color-progress-soft)' },
  resolved: { label: 'Resolved', color: 'var(--color-resolved)', soft: 'var(--color-resolved-soft)' },
} as const

export function StatusChip({ status }: { status: keyof typeof STATUS }) {
  const m = STATUS[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-medium" style={{ backgroundColor: m.soft, color: m.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  )
}

/* ---------- Hero browser mockup ---------- */
export function BrowserMockup() {
  return (
    <div className="relative rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
        <span className="font-code ml-3 rounded-md bg-bg px-3 py-1 text-[0.7rem] text-ink-mute">acme.store/checkout</span>
      </div>
      <div className="space-y-4 p-6">
        <div className="h-2.5 w-24 rounded-full bg-line" />
        <div className="h-16 rounded-lg bg-surface-2" />
        <div className="flex gap-3">
          <div className="h-10 flex-1 rounded-lg bg-surface-2" />
          <div className="h-10 flex-1 rounded-lg bg-surface-2" />
        </div>
        <div className="relative w-fit">
          <div className="rounded-lg border-2 border-accent bg-accent-soft px-5 py-2.5 text-[0.8125rem] font-medium text-accent">Checkout</div>
          <span className="absolute -right-2 -top-3"><Pin size={20} /></span>
          <div className="absolute bottom-[140%] left-0 w-56 rounded-xl border border-line bg-surface p-3 shadow-card">
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[0.6rem] font-bold text-accent-ink">C</span>
              <span className="text-[0.7rem] font-medium text-ink-dim">Client, 2m ago</span>
            </div>
            <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink">Button text overflows on mobile.</p>
            <div className="mt-2"><StatusChip status="new" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Flow diagram ---------- */
type Node = { icon: ReactNode; title: string; detail: string; extra?: ReactNode }

function FlowNode({ n, i }: { n: Node; i: number }) {
  return (
    <div className="relative flex-1 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">{n.icon}</span>
        <span className="font-code text-[0.7rem] text-ink-mute">{String(i + 1).padStart(2, '0')}</span>
      </div>
      <h3 className="mt-3 text-[0.9375rem] font-semibold leading-tight text-ink">{n.title}</h3>
      <p className="mt-1 text-[0.8125rem] leading-snug text-ink-dim">{n.detail}</p>
      {n.extra && <div className="mt-3">{n.extra}</div>}
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex shrink-0 items-center justify-center text-ink-mute lg:px-1">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 lg:rotate-0" aria-hidden>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </div>
  )
}

export function FlowDiagram() {
  const nodes: Node[] = [
    { icon: <IconCursor />, title: 'Click any element', detail: 'Turn on tag mode, hover to highlight, click the exact component.' },
    { icon: <IconCamera />, title: 'It captures the context', detail: 'A cropped screenshot plus the element location, saved automatically.' },
    { icon: <IconDatabase />, title: 'Added to your project', detail: 'Stored against a private project the extension remembers for you.' },
    { icon: <IconLink />, title: 'Share one link', detail: 'Send the list URL. No accounts, no invites, no setup for viewers.' },
    {
      icon: <IconSparkle />, title: 'Triage and fix', detail: 'View each pin, jump to it live, move its status, copy an AI-fix prompt.',
      extra: (
        <div className="flex flex-wrap gap-1.5">
          <StatusChip status="new" /><StatusChip status="in_progress" /><StatusChip status="resolved" />
        </div>
      ),
    },
  ]
  return (
    <div className="flex flex-col items-stretch gap-3 lg:flex-row">
      {nodes.map((n, i) => (
        <div key={i} className="contents">
          <FlowNode n={n} i={i} />
          {i < nodes.length - 1 && <Arrow />}
        </div>
      ))}
    </div>
  )
}
