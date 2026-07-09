'use client'
import { nextStatuses, type Status } from '@/lib/tags'
import { setStatus } from '../../actions'

export function StatusSelect({ tagId, value }: { tagId: string; value: Status }) {
  return (
    <select defaultValue={value} onChange={(e) => setStatus(tagId, e.target.value)}
            className="border rounded p-1">
      {nextStatuses().map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}
