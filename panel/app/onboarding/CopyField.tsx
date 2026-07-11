'use client'
import { useState } from 'react'
export function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false)
  return (
    <div>
      <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-dim">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-surface-2 p-2 pl-3">
        <code className="mono flex-1 truncate text-[0.8125rem] text-ink-dim">{value}</code>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200) }}
          className="ring-accent shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[0.75rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press">{done ? 'Copied' : 'Copy'}</button>
      </div>
    </div>
  )
}
