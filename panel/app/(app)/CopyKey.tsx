'use client'
import { useState } from 'react'

/** Truncated mono project key with a click-to-copy affordance. */
export function CopyKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const short = value.length > 10 ? `${value.slice(0, 8)}…` : value

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 600)
      }}
      title="Copy project key"
      className="mono ring-accent group inline-flex items-center gap-2 text-[0.75rem] text-ink-mute transition-colors hover:text-ink-dim"
    >
      <span>{short}</span>
      <span className={`text-ink-mute group-hover:text-accent ${copied ? 'copy-pulse' : ''}`}>
        {copied ? 'copied' : 'copy'}
      </span>
    </button>
  )
}
