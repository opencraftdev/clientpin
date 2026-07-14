'use client'
import { useEffect, useState } from 'react'
import { Logo, Avatar, GitHubMark } from './parts'
import { formatStars, GITHUB_URL } from '@/lib/github'
import type { Profile } from '@/lib/user'

export function Nav({ profile, stars }: { profile: Profile | null; stars: number | null }) {
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
          <a href="#community" className="transition-colors hover:text-ink">Community</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" aria-label="Star ClientPin on GitHub"
            className="inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[0.8125rem] font-medium text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink">
            <GitHubMark size={16} />
            {stars != null && <span className="font-code tabular-nums">{formatStars(stars)}</span>}
          </a>
          {profile ? (
            <>
              <a href="/projects" className="bg-accent px-4 py-2 text-[0.8125rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press">Dashboard</a>
              <a href="/projects" aria-label={`${profile.name}, open dashboard`} className="ring-accent"><Avatar src={profile.avatarUrl} name={profile.name} size={32} /></a>
            </>
          ) : (
            <a href="/login" className="bg-accent px-4 py-2 text-[0.8125rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press">Try now</a>
          )}
        </div>
      </div>
    </header>
  )
}
