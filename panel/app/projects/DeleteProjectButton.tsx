'use client'
import { useState, useTransition } from 'react'
import { deleteProject } from './actions'

function TrashIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6M10 11v6M14 11v6" />
    </svg>
  )
}

// Two-step confirm so a project is never deleted on a single stray click.
// No modal (DESIGN.md bans modal-first), no native confirm().
export function DeleteProjectButton({ slug, name }: { slug: string; name: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, start] = useTransition()

  if (confirm) {
    return (
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 bg-surface">
        <button type="button" disabled={pending} onClick={() => start(() => deleteProject(slug))}
          className="ring-accent border px-2.5 py-1 text-[0.75rem] font-semibold uppercase tracking-wide transition-colors disabled:opacity-60"
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
          {pending ? 'Deleting…' : 'Delete'}
        </button>
        <button type="button" disabled={pending} onClick={() => setConfirm(false)}
          className="ring-accent border border-line px-2.5 py-1 text-[0.75rem] font-medium text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink">Cancel</button>
      </div>
    )
  }

  return (
    <button type="button" aria-label={`Delete ${name}`} onClick={() => setConfirm(true)}
      className="ring-accent absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center border border-line bg-surface text-ink-mute opacity-0 transition-all hover:text-[var(--color-danger)] focus-visible:opacity-100 group-hover:opacity-100">
      <TrashIcon />
    </button>
  )
}
