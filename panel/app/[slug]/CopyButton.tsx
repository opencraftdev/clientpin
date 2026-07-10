'use client'
import { useState } from 'react'

export function CopyButton({ text, label = 'AI Fix', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1200)
        } catch {
          // clipboard unavailable (non-secure context / denied) — no-op
        }
      }}
      className={className}
    >
      {done ? 'Copied' : label}
    </button>
  )
}
