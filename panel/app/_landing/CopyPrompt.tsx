'use client'
import { useState } from 'react'

export function CopyPrompt({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200) } catch {}
      }}
      className="rounded-md bg-surface-2 px-2.5 py-1 text-[0.75rem] font-medium text-ink-dim transition-colors hover:text-ink"
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}
