import { Pin } from './parts'

// Decorative floating "example tag" cards for the hero corners — each looks
// like a QA pin dropped on the page (pin marker + comment + coordinate +
// status). aria-hidden + pointer-events-none; shown only on wide screens
// where they clear the centered headline.
type ExampleTag = { pos: string; comment: string; coord: string; status: 'new' | 'progress'; delay: string }

const TAGS: ExampleTag[] = [
  { pos: 'left-[3%] top-[19%]', comment: 'Logo feels cramped here', coord: '/ · <header>', status: 'new', delay: '0s' },
  { pos: 'right-[3%] top-[13%]', comment: 'Heading tracking too tight', coord: '/ · <h1>', status: 'progress', delay: '1.1s' },
  { pos: 'left-[4%] top-[62%]', comment: 'Bump the button contrast', coord: '/ · <button.cta>', status: 'new', delay: '0.6s' },
  { pos: 'right-[3%] top-[57%]', comment: 'Link 404s on submit', coord: '/checkout · <a>', status: 'progress', delay: '1.7s' },
]

const STATUS = {
  new: { label: 'New', color: 'var(--color-new)', soft: 'var(--color-new-soft)' },
  progress: { label: 'In progress', color: 'var(--color-progress)', soft: 'var(--color-progress-soft)' },
} as const

export function HeroTags() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 hidden xl:block">
      {TAGS.map((t) => {
        const s = STATUS[t.status]
        return (
          <figure key={t.coord} className={`absolute ${t.pos} w-52`}>
            <div className="float-soft relative border border-line bg-surface/95 p-3 shadow-card backdrop-blur-sm" style={{ animationDelay: t.delay }}>
              <span className="absolute -left-2.5 -top-3.5"><Pin size={17} /></span>
              <p className="pl-1 text-[0.8125rem] font-semibold leading-snug text-ink">{t.comment}</p>
              <p className="font-code mt-1.5 truncate pl-1 text-[0.62rem] text-ink-mute">{t.coord}</p>
              <span className="mt-2 ml-1 inline-flex items-center gap-1 border px-1.5 py-0.5 font-code text-[0.55rem] font-semibold uppercase tracking-wide"
                style={{ color: s.color, background: s.soft, borderColor: s.color }}>
                <span className="h-1 w-1 rounded-full" style={{ background: s.color }} /> {s.label}
              </span>
            </div>
          </figure>
        )
      })}
    </div>
  )
}
