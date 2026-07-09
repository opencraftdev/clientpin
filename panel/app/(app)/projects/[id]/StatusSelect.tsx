'use client'
import { useState, useTransition } from 'react'
import { nextStatuses, STATUS_META, type Status } from '@/lib/tags'
import { setStatus } from '../../actions'

/** The status control also IS the status display: colored dot + label, editable. */
export function StatusSelect({ tagId, value }: { tagId: string; value: Status }) {
  const [current, setCurrent] = useState<Status>(value)
  const [pending, start] = useTransition()
  const m = STATUS_META[current]

  return (
    <div className="relative inline-flex items-center">
      <span aria-hidden className="pointer-events-none absolute left-2.5 text-[0.65rem]" style={{ color: m.color }}>
        {m.glyph}
      </span>
      <select
        value={current}
        disabled={pending}
        aria-label="Tag status"
        onChange={(e) => {
          const next = e.target.value as Status
          setCurrent(next)
          start(() => setStatus(tagId, next))
        }}
        className="mono ring-accent appearance-none rounded-md border border-line bg-surface py-1 pl-6 pr-7 text-[0.8125rem] font-medium transition-colors hover:border-line-2 focus:border-accent focus:outline-none disabled:opacity-60"
        style={{ color: m.color }}
      >
        {nextStatuses().map((s) => (
          <option key={s} value={s} className="bg-surface text-ink">
            {STATUS_META[s].label}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-[0.7rem] text-ink-mute">▾</span>
    </div>
  )
}
