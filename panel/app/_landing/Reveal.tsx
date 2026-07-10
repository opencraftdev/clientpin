'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'

// Renders visible by default (SSR + no-JS safe). After mount it briefly hides,
// then reveals when scrolled into view. A fallback timer guarantees the content
// is never left hidden if the observer never fires.
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'idle' | 'pending' | 'in'>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setState('pending')
    let done = false
    const reveal = () => { if (!done) { done = true; setState('in') } }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { reveal(); io.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    const timer = setTimeout(reveal, 1500)
    return () => { io.disconnect(); clearTimeout(timer) }
  }, [])

  const cls = state === 'pending' ? 'reveal pending' : state === 'in' ? 'reveal in' : 'reveal'
  return (
    <div ref={ref} className={`${cls} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
