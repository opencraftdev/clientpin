import type { Milestone } from '@/lib/dashboard'
import { OwnerMilestoneSelect } from './OwnerMilestones'
const STEPS = ['waiting', 'in_progress', 'done'] as const
const LABEL = { waiting: 'Waiting', in_progress: 'In progress', done: 'Done' }
export function Milestones({ milestones, isOwner, slug }: { milestones: Milestone[]; isOwner?: boolean; slug?: string }) {
  if (!milestones.length) return <p className="text-[0.875rem] text-ink-mute">No milestones yet.</p>
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {milestones.map((m, i) => {
        const idx = STEPS.indexOf(m.status)
        return (
          <div key={i} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[0.9375rem] font-semibold text-ink">{m.name}</span>
              {isOwner && slug
                ? <OwnerMilestoneSelect slug={slug} index={i} value={m.status} />
                : <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.6875rem] font-medium text-accent">{LABEL[m.status]}</span>}
            </div>
            <div className="mt-3 flex items-center">
              {STEPS.map((s, si) => (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[0.7rem] font-semibold ${si <= idx ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-mute'}`}>{si < idx ? '✓' : si + 1}</span>
                  {si < STEPS.length - 1 && <span className={`h-0.5 flex-1 ${si < idx ? 'bg-accent' : 'bg-line'}`} />}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
