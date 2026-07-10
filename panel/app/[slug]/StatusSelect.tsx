'use client'
import { useState, useTransition } from 'react'
import { STATUSES, STATUS_META, type Status } from '@/lib/types'
import { setStatus } from '../actions'

export function StatusSelect({ slug, tagId, value }: { slug: string; tagId: string; value: Status }) {
  const [current, setCurrent] = useState<Status>(value)
  const [pending, start] = useTransition()
  const m = STATUS_META[current]
  return (
    <div className="relative inline-flex items-center rounded-full" style={{ backgroundColor: m.soft }}>
      <span aria-hidden className="pointer-events-none absolute left-3 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      <select
        value={current} disabled={pending} aria-label="Status"
        onChange={(e) => { const n = e.target.value as Status; setCurrent(n); start(() => setStatus(slug, tagId, n)) }}
        className="ring-accent cursor-pointer appearance-none rounded-full bg-transparent py-1 pl-6 pr-7 text-[0.8125rem] font-medium focus:outline-none disabled:opacity-60"
        style={{ color: m.color }}
      >
        {STATUSES.map((s) => <option key={s} value={s} className="bg-surface text-ink">{STATUS_META[s].label}</option>)}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-[0.7rem]" style={{ color: m.color }}>▾</span>
    </div>
  )
}
