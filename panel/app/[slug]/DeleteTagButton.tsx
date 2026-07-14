'use client'
import { useState, useTransition } from 'react'
import { deleteTag } from '../actions'

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6M10 11v6M14 11v6" />
    </svg>
  )
}

// Two-step confirm so a pin is never deleted on a single stray click.
export function DeleteTagButton({ slug, tagId }: { slug: string; tagId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, start] = useTransition()

  if (confirm) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button type="button" disabled={pending} onClick={() => start(() => deleteTag(slug, tagId))}
          className="ring-accent border px-2 py-1 text-[0.72rem] font-semibold uppercase tracking-wide transition-colors disabled:opacity-60"
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
          {pending ? 'Deleting…' : 'Delete'}
        </button>
        <button type="button" disabled={pending} onClick={() => setConfirm(false)}
          className="ring-accent border border-line px-2 py-1 text-[0.72rem] font-medium text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink">Cancel</button>
      </span>
    )
  }

  return (
    <button type="button" aria-label="Delete pin" onClick={() => setConfirm(true)}
      className="ring-accent grid h-7 w-7 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-surface-2 hover:text-[var(--color-danger)]">
      <TrashIcon />
    </button>
  )
}
