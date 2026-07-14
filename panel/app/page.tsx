import { Nav } from './_landing/Nav'
import { Splash } from './_landing/Splash'
import { Community } from './_landing/Community'
import { HeroTags } from './_landing/HeroTags'
import { createClient } from '@/lib/supabase/server'
import { profileOf } from '@/lib/user'
import { githubStars } from '@/lib/github'
import { Reveal } from './_landing/Reveal'
import { Pin, Logo, ListPreview, IconDownload, IconCheck, IconClock } from './_landing/parts'
import { TagDemo, Pipeline, LocateShot, FixShot, ShareShot } from './_landing/Demos'
import { InstallSteps, DownloadButton, DOWNLOAD_URL } from './_landing/InstallSteps'
import type { ReactNode } from 'react'

const FAQ: [string, string][] = [
  ['Is it free?', 'Yes. ClientPin is free to install and use. No accounts for viewers, no paywall.'],
  ['Do my clients need an account?', 'No. You create projects from the extension; anyone with the list link and its password can view it and change statuses.'],
  ['What data is stored?', 'Only what you tag: the comment, a screenshot of the component, its page URL, and its location on the page.'],
  ['What happens after 7 days?', 'A list is deleted 7 days after its last activity, including its screenshots. Add or update a pin to keep it alive.'],
  ['Which browsers work?', 'Any Chromium browser: Chrome, Edge, Brave, Arc, and Opera.'],
]

// Alternating product-showcase row: a live mock on one side, a few words on the other.
function Showcase({ eyebrow, title, body, visual, flip }: { eyebrow: string; title: string; body: string; visual: ReactNode; flip?: boolean }) {
  return (
    <Reveal>
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className={flip ? 'lg:order-2' : ''}>
          <p className="font-code text-[0.75rem] font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
          <h3 className="font-display mt-2 text-[1.75rem] font-bold leading-tight tracking-[-0.02em]">{title}</h3>
          <p className="mt-3 max-w-md text-[1rem] leading-relaxed text-ink-dim">{body}</p>
        </div>
        <div className={flip ? 'lg:order-1' : ''}>{visual}</div>
      </div>
    </Reveal>
  )
}

export default async function Landing() {
  const supabase = await createClient()
  const [{ data: { user } }, stars] = await Promise.all([supabase.auth.getUser(), githubStars()])
  const profile = profileOf(user)
  // Logged-in visitors already have an account, so the CTA invites them to
  // create a project instead of signing up.
  const cta = profile
    ? { href: '/onboarding', label: 'Start your project' }
    : { href: '/login', label: "Try now, it's free" }
  return (
    <div id="top" className="font-body min-h-screen overflow-x-hidden bg-bg text-ink">
      <Splash />
      <Nav profile={profile} stars={stars} />

      {/* Hero — the product does the talking */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="grid-blueprint pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(48% 32% at 50% -4%, var(--color-accent-soft), transparent 72%)' }} />
        <HeroTags />
        <div className="relative z-10 mx-auto max-w-3xl px-6 pt-16 text-center lg:pt-24">
          <p className="font-code rise mx-auto mb-6 inline-flex items-center gap-2 border border-ink bg-surface/80 px-3 py-1 text-[0.7rem] uppercase tracking-wide text-ink-dim backdrop-blur-sm" style={{ animationDelay: '0ms' }}>
            <Pin size={13} /> Chrome extension for UI QA
          </p>
          <h1 className="rise font-display font-extrabold uppercase leading-[0.9] tracking-[-0.035em]" style={{ fontSize: 'clamp(2.7rem, 7vw, 5rem)', animationDelay: '80ms' }}>
            Point at the bug.<br /><span className="text-accent">Pin it.</span> Share it.
          </h1>
          <p className="rise mx-auto mt-6 max-w-xl text-[1.125rem] leading-relaxed text-ink-dim" style={{ animationDelay: '160ms' }}>
            Turn on tag mode, click the exact element on any live site, and leave a comment. Every pin becomes a screenshot, a status, and an AI-fix prompt, shared as one link.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '240ms' }}>
            <a href={cta.href} className="shadow-edge inline-flex items-center gap-2 bg-accent px-6 py-3 text-[0.9375rem] font-semibold text-accent-ink transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">{cta.label}</a>
            <a href="#how" className="border border-ink bg-surface px-5 py-3 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-bg">See how it works</a>
          </div>
          <div className="rise mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.8125rem] text-ink-mute" style={{ animationDelay: '300ms' }}>
            {['Free', 'No account for viewers', 'Works in Chrome, Edge, Brave'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5"><span className="text-accent"><IconCheck /></span> {t}</span>
            ))}
          </div>
        </div>
        {/* The money shot: tag mode, live */}
        <div className="relative mx-auto mt-14 max-w-4xl px-6">
          <div className="rise reg-marks rounded-2xl" style={{ animationDelay: '380ms' }}><TagDemo /></div>
        </div>
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-6 text-center">
          <a href="https://ocraft.id/" target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-mute transition-colors hover:text-ink-dim">
            Powered by <span className="font-semibold text-ink-dim">Opencraft</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17L17 7M9 7h8v8" /></svg>
          </a>
        </div>
      </section>

      {/* How it works — the pipeline, shown not told */}
      <section id="how" className="scroll-mt-16 border-t border-line bg-surface-2">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="text-center">
            <p className="font-code text-[0.8rem] font-medium text-accent">HOW IT WORKS</p>
            <h2 className="mx-auto mt-2 max-w-2xl font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>From click to shareable list.</h2>
          </Reveal>
          <div className="mt-14"><Reveal><Pipeline /></Reveal></div>
          <Reveal delay={120}><p className="mt-8 flex items-center justify-center gap-2 text-[0.8125rem] text-ink-mute"><IconClock /> Lists auto-delete 7 days after the last activity, so nothing lingers.</p></Reveal>
        </div>
      </section>

      {/* Showcase rows — each feature is a real product frame */}
      <section id="features" className="scroll-mt-16 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-24">
          <Showcase
            eyebrow="The result"
            title="Every pin lands in one shareable list."
            body="Screenshot, comment, page, and element location for each issue, in a single link your clients and developers just open. No sign-up on their side."
            visual={<ListPreview />} />
          <Showcase flip
            eyebrow="Triage + AI"
            title="A status for every pin, and a one-click AI fix."
            body="Move each item from New to In progress to Resolved. Copy a ready-to-paste prompt with the comment, selector, and page baked in."
            visual={<FixShot />} />
          <Showcase
            eyebrow="Locate"
            title="Jump straight to the live element."
            body="Click a pin to open the page and scroll right to the component it marks, highlighted, so there is never any guessing about which thing you meant."
            visual={<LocateShot />} />
        </div>
      </section>

      {/* Privacy band */}
      <section className="border-t border-line bg-surface-2">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-20 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <p className="font-code text-[0.8rem] font-medium text-accent">PRIVATE BY DEFAULT</p>
            <h2 className="mt-2 font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>One private link. Gone in 7 days.</h2>
            <p className="mt-3 max-w-md text-[1rem] leading-relaxed text-ink-dim">Lists are reachable only by their link and its password, and auto-delete a week after the last activity. Nothing to clean up.</p>
          </Reveal>
          <Reveal delay={80}><ShareShot /></Reveal>
        </div>
      </section>

      {/* Get started — lead with trying it; the extension is just the tool */}
      <section id="install" className="scroll-mt-16 border-t border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <p className="font-code text-[0.8rem] font-medium text-accent">GET STARTED</p>
            <h2 className="mt-2 font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Try ClientPin free.</h2>
            <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-ink-dim">Create a project, share one link, and start pinning issues on any live site. No credit card, and your clients never make an account.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href={cta.href} className="shadow-edge inline-flex items-center gap-2 bg-accent px-6 py-3 text-[0.9375rem] font-semibold text-accent-ink transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">{cta.label}</a>
              <a href="#how" className="border border-ink bg-surface px-5 py-3 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-bg">See how it works</a>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-ink-mute">
              {['Free', 'No account for viewers', 'Works in Chrome, Edge, Brave'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><span className="text-accent"><IconCheck /></span> {t}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="border border-line bg-surface-2 p-6">
              <p className="font-code text-[0.7rem] font-semibold uppercase tracking-wide text-ink-mute">The tool</p>
              <h3 className="font-display mt-1 text-[1.15rem] font-bold tracking-[-0.01em] text-ink">A one-time browser extension</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-dim">ClientPin runs as a lightweight Chromium extension you load once — that&apos;s how you tag elements. Your projects and lists live on the web. Not on the Web Store yet, so you load the build directly (about a minute).</p>
              <div className="mt-5"><DownloadButton label="Download extension (.zip)" /></div>
              <details className="group mt-4 border-t border-line pt-4">
                <summary className="font-code flex cursor-pointer list-none items-center justify-between text-[0.7rem] font-semibold uppercase tracking-wide text-ink-dim transition-colors hover:text-ink">Install steps <span className="text-ink-mute transition-transform group-open:rotate-45">+</span></summary>
                <div className="mt-4"><InstallSteps /></div>
              </details>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-t border-line bg-surface-2">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal><h2 className="text-center font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}>Questions, answered.</h2></Reveal>
          <div className="mt-10 flex flex-col gap-3">
            {FAQ.map(([q, a], i) => (
              <Reveal key={i} delay={i * 40}>
                <details className="group rounded-xl border border-line bg-surface px-5 py-4 shadow-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1rem] font-semibold text-ink">{q}<span className="text-ink-mute transition-transform group-open:rotate-45">+</span></summary>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-dim">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <Community />

      {/* Final CTA — the one deliberate coral drench */}
      <section className="bg-accent">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display font-bold leading-tight tracking-[-0.02em] text-accent-ink" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}>Stop describing bugs. Pin them.</h2>
            <p className="mt-2 text-[1rem] text-accent-ink/85">Create your first project and share a list in minutes.</p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
            <a href={cta.href} className="inline-flex items-center gap-2 bg-bg px-6 py-3.5 text-[1rem] font-semibold text-accent transition-transform hover:-translate-y-0.5">{cta.label} →</a>
            <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-accent-ink/80 underline-offset-4 transition-colors hover:text-accent-ink hover:underline"><IconDownload /> or download the extension</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-[0.8125rem] text-ink-mute">
        <Logo size={22} />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#how" className="transition-colors hover:text-ink-dim">How it works</a>
          <a href="#features" className="transition-colors hover:text-ink-dim">Features</a>
          <a href="#install" className="transition-colors hover:text-ink-dim">Install</a>
          <a href="#faq" className="transition-colors hover:text-ink-dim">FAQ</a>
          <a href="#community" className="transition-colors hover:text-ink-dim">Community</a>
          <span>Lists expire after 7 days.</span>
        </div>
      </footer>
    </div>
  )
}
