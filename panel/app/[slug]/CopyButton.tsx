'use client'
import { useState } from 'react'

export function CopyButton({ text, label = 'AI Fix', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200) }}
      className={className}
    >
      {done ? 'Copied' : label}
    </button>
  )
}
