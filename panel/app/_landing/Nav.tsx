'use client'
import { useEffect, useState } from 'react'
import { Logo } from './parts'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 transition-colors ${scrolled ? 'border-b border-line bg-bg/80 backdrop-blur-md' : 'border-b border-transparent'}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <a href="#top" className="flex items-center"><Logo /></a>
        <nav className="hidden items-center gap-7 text-[0.875rem] text-ink-dim sm:flex">
          <a href="#how" className="transition-colors hover:text-ink">How it works</a>
          <a href="#features" className="transition-colors hover:text-ink">Features</a>
          <a href="#faq" className="transition-colors hover:text-ink">FAQ</a>
        </nav>
        <a href="/login" className="bg-accent px-4 py-2 text-[0.8125rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press">
          Try now
        </a>
      </div>
    </header>
  )
}
