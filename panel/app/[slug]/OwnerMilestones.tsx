'use client'
import { useTransition } from 'react'
import type { Milestone } from '@/lib/dashboard'
import { setMilestoneStatus } from '../actions'

export function OwnerMilestoneSelect({ slug, index, value }: { slug: string; index: number; value: Milestone['status'] }) {
  const [pending, start] = useTransition()
  return (
    <select disabled={pending} defaultValue={value}
      onChange={(e) => start(() => setMilestoneStatus(slug, index, e.target.value as Milestone['status']))}
      className="ring-accent rounded-full bg-accent-soft px-2 py-0.5 text-[0.6875rem] font-medium text-accent disabled:opacity-60">
      <option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="done">Done</option>
    </select>
  )
}
