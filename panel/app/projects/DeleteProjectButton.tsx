'use client'
import { useEffect, useState, useTransition } from 'react'
import { deleteProject } from './actions'

function TrashIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6M10 11v6M14 11v6" />
    </svg>
  )
}

// Destructive delete gated by a type-the-name confirmation modal (GitHub-style).
// The modal is the justified exception to DESIGN.md's modal ban: an
// irreversible action that must be hard to trigger by accident.
export function DeleteProjectButton({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [err, setErr] = useState('')
  const [pending, start] = useTransition()
  const matches = typed.trim() === name.trim()

  const close = () => { if (!pending) { setOpen(false); setTyped(''); setErr('') } }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, pending])

  const confirmDelete = () => {
    if (!matches) return
    setErr('')
    start(async () => {
      try { await deleteProject(slug) } catch (e) { setErr((e as Error).message) }
    })
  }

  return (
    <>
      <button type="button" aria-label={`Delete ${name}`} onClick={() => setOpen(true)}
        className="ring-accent absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center border border-line bg-surface text-ink-mute opacity-0 transition-all hover:text-[var(--color-danger)] focus-visible:opacity-100 group-hover:opacity-100">
        <TrashIcon />
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Delete ${name}`}
          className="fixed inset-0 z-50 grid place-items-center p-4"
          style={{ background: 'oklch(0.185 0.022 275 / 0.45)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className="shadow-edge w-full max-w-md border border-ink bg-surface p-6">
            <h2 className="font-display text-[1.25rem] font-bold tracking-[-0.01em] text-ink">Delete project</h2>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-dim">
              This permanently deletes <span className="font-semibold text-ink">{name}</span>, its QA pins, and their screenshots. This cannot be undone.
            </p>
            <label className="mt-5 block">
              <span className="font-code text-[0.72rem] font-semibold uppercase tracking-wide text-ink-dim">Type <span className="text-ink">{name}</span> to confirm</span>
              <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} spellCheck={false}
                onKeyDown={(e) => { if (e.key === 'Enter' && matches && !pending) confirmDelete() }}
                className="ring-accent mt-1.5 w-full border border-line bg-surface px-3 py-2 text-[0.875rem] text-ink outline-none focus:border-[var(--color-danger)]" />
            </label>
            {err && <p className="mt-2 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>{err}</p>}
            <div className="mt-6 flex justify-end gap-2.5">
              <button type="button" onClick={close} disabled={pending}
                className="ring-accent border border-line px-4 py-2 text-[0.875rem] font-medium text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-60">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={!matches || pending}
                className="ring-accent px-4 py-2 text-[0.875rem] font-semibold text-accent-ink transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: 'var(--color-danger)' }}>
                {pending ? 'Deleting…' : 'Delete project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
