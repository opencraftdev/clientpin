'use client'
import { useState } from 'react'
export function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false)
  return (
    <div>
      <span className="text-[0.75rem] font-medium text-ink-dim">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-surface p-2">
        <code className="mono flex-1 truncate px-1 text-[0.8125rem] text-ink">{value}</code>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200) }}
          className="ring-accent rounded-md bg-accent px-3 py-1 text-[0.75rem] font-medium text-accent-ink">{done ? 'Copied' : 'Copy'}</button>
      </div>
    </div>
  )
}
