import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Nav } from './_landing/Nav'
import { Reveal } from './_landing/Reveal'
import { CopyPrompt } from './_landing/CopyPrompt'
import {
  Pin, BrowserMockup, FlowDiagram, StatusChip,
  IconDownload, IconCamera, IconLocate, IconLink, IconShield, IconSparkle, IconCheck, IconClock,
} from './_landing/parts'

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-bricolage' })
const body = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-hanken' })
const codeFont = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jb' })

const heroGlow = { background: 'radial-gradient(58rem 40rem at 50% -22%, oklch(0.62 0.20 262 / 0.13), transparent 70%)' }

const PROMPT = `Fix this UI issue on https://acme.store/checkout:

Problem: "Button text overflows on mobile"
Element: <button>  (selector: main > section:nth-of-type(2) > button.cta)
Status: new

Apply a minimal, accessible fix consistent with the existing design system.`

const STEPS = [
  'Tag a component. In the extension, pick or create a project, turn on tag mode, and click the element you want to flag. Hovering highlights each component so you pin the right one, then you leave a comment in an inline bubble.',
  'It captures the context. ClientPin saves a cropped screenshot of that exact component plus a resilient anchor (its selector, tag, and nearby text) so it can be found again even after the page changes. No more describing "the button near the footer."',
  'Share one link. Every project is a public list at its own URL. Send it to a client, a developer, or a teammate. They open it in a browser, no account, no install, and see every pin with its screenshot.',
  'Triage and fix. On the list, anyone can jump to the element on the live page, move each item New to In progress to Resolved, and copy a ready-to-paste AI-fix prompt. Lists auto-delete 7 days after the last activity.',
]

const FAQ = [
  ['Is it free?', 'Yes. ClientPin is free to install and use. There are no accounts and no paywall.'],
  ['Do I or my clients need an account?', 'No. You create projects from the extension, and anyone with a list link can view it and change statuses. Nothing to sign up for.'],
  ['What data is stored?', 'Only what you tag: the comment, a screenshot of the component, its page URL, and its location on the page. It lives in a private database and is served by link.'],
  ['Why is it not on the Chrome Web Store yet?', 'It is in review. For now you install the build directly (it takes about a minute, see the steps above). Once it is published, you will be able to add it in one click.'],
  ['What happens after 7 days?', 'A list is deleted 7 days after its last activity, including its screenshots. Keep a list alive by adding or updating a tag.'],
  ['Which browsers work?', 'Any Chromium browser: Chrome, Edge, Brave, Arc, and Opera.'],
]

export default function Landing() {
  return (
    <div id="top" className={`${display.variable} ${body.variable} ${codeFont.variable} font-body min-h-screen overflow-x-hidden bg-bg text-ink`}>
      <Nav />

      {/* Hero */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={heroGlow} />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <p className="rise mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[0.75rem] text-ink-dim" style={{ animationDelay: '0ms' }}>
              <Pin size={13} /> Chrome extension for UI QA and client feedback
            </p>
            <h1 className="rise font-display font-extrabold leading-[0.95] tracking-[-0.03em] text-ink" style={{ fontSize: 'clamp(2.9rem, 7vw, 5.5rem)', animationDelay: '80ms' }}>
              Point at the bug.<br /><span className="text-accent">Pin it.</span> Share it.
            </h1>
            <p className="rise mt-6 max-w-lg text-[1.125rem] leading-relaxed text-ink-dim" style={{ animationDelay: '160ms' }}>
              ClientPin lets you and your clients tag UI issues on any live site just by clicking the element. Every pin becomes a screenshot, a status, and an AI-fix prompt, all shared as one link.
            </p>
            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '240ms' }}>
              <a href="#install" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[0.9375rem] font-semibold text-accent-ink shadow-bar transition-colors hover:bg-accent-press">
                <IconDownload /> Download the extension
              </a>
              <a href="#how" className="rounded-full px-5 py-3 text-[0.9375rem] font-medium text-ink-dim transition-colors hover:text-ink">See how it works</a>
            </div>
            <div className="rise mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-ink-mute" style={{ animationDelay: '300ms' }}>
              <span className="inline-flex items-center gap-1.5"><span className="text-accent"><IconCheck /></span> Free</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-accent"><IconCheck /></span> No account</span>
              <span className="inline-flex items-center gap-1.5"><span className="text-accent"><IconCheck /></span> Works in Chrome, Edge, Brave</span>
            </div>
          </div>
          <div className="rise" style={{ animationDelay: '360ms' }}><BrowserMockup /></div>
        </div>
      </section>

      {/* Value strip */}
      <section className="border-y border-line bg-surface-2">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-3">
          {[
            'No more "the button near the footer."',
            'Every report ships with a screenshot.',
            'One link to share. No logins for anyone.',
          ].map((t) => (
            <div key={t} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0"><Pin size={16} /></span>
              <p className="text-[0.9375rem] font-medium leading-snug text-ink">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-24">
        <Reveal>
          <p className="font-code text-[0.8rem] font-medium text-accent">HOW IT WORKS</p>
          <h2 className="mt-2 max-w-2xl font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
            From one click to a shareable fix list.
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-12"><FlowDiagram /></Reveal>
        <Reveal delay={120}>
          <p className="mt-4 flex items-center gap-2 text-[0.8125rem] text-ink-mute">
            <IconClock /> Lists auto-delete 7 days after the last activity, so nothing lingers.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {STEPS.map((s, i) => {
            const title = s.split('.')[0]
            const rest = s.slice(title.length + 2)
            return (
              <Reveal key={i} delay={i * 60}>
                <div className="flex gap-4">
                  <span className="font-display text-[1.5rem] font-extrabold leading-none text-accent/30" style={{ color: 'color-mix(in oklch, var(--color-accent) 35%, transparent)' }}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-[1.0625rem] font-semibold text-ink">{title}.</h3>
                    <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-dim">{rest}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Features (bento) */}
      <section id="features" className="border-t border-line bg-surface-2 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <p className="font-code text-[0.8rem] font-medium text-accent">FEATURES</p>
            <h2 className="mt-2 max-w-2xl font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
              Everything a good bug report needs, captured in a click.
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
            {/* Screenshots */}
            <Reveal className="lg:col-span-6">
              <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><IconCamera /></span>
                <h3 className="mt-4 text-[1.1875rem] font-semibold tracking-tight">Pinpoint screenshots</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-dim">Each tag captures a cropped image of the exact component, not the whole page.</p>
                <div className="relative mt-5 overflow-hidden rounded-xl border border-line bg-bg p-5">
                  <div className="mx-auto w-fit">
                    <div className="rounded-lg border-2 border-accent bg-accent-soft px-6 py-3 text-[0.8125rem] font-medium text-accent">Checkout</div>
                    <span className="absolute right-[36%] top-2"><Pin size={18} /></span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Status lifecycle */}
            <Reveal className="lg:col-span-6" delay={60}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><IconCheck /></span>
                <h3 className="mt-4 text-[1.1875rem] font-semibold tracking-tight">A status for every pin</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-dim">Move each item through the lifecycle. Anyone with the link can update it.</p>
                <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bg p-5">
                  <StatusChip status="new" />
                  <span className="text-ink-mute">→</span>
                  <StatusChip status="in_progress" />
                  <span className="text-ink-mute">→</span>
                  <StatusChip status="resolved" />
                </div>
              </div>
            </Reveal>

            {/* AI-fix prompt */}
            <Reveal className="lg:col-span-7" delay={120}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><IconSparkle /></span>
                  <CopyPrompt text={PROMPT} />
                </div>
                <h3 className="mt-4 text-[1.1875rem] font-semibold tracking-tight">One-click AI-fix prompts</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-dim">Copy a ready-to-paste prompt for any coding assistant, with the comment, selector, and page baked in.</p>
                <pre className="font-code mt-5 overflow-x-auto rounded-xl border border-line bg-bg p-4 text-[0.75rem] leading-relaxed text-ink-dim">{PROMPT}</pre>
              </div>
            </Reveal>

            {/* Locate + Share + Private column */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              <Reveal delay={160}>
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><IconLocate /></span>
                  <h3 className="mt-4 text-[1.1875rem] font-semibold tracking-tight">Jump to the live element</h3>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-dim">Click a pin to open the page and scroll straight to the component.</p>
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><IconLink /></span>
                  <h3 className="mt-4 text-[1.1875rem] font-semibold tracking-tight">Share by link, no accounts</h3>
                  <p className="mt-3 font-code inline-flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-1.5 text-[0.75rem] text-ink-dim">clientpin.app/<span className="text-accent">HDc7dS5F2s</span></p>
                </div>
              </Reveal>
            </div>

            {/* Privacy / expiry (wide) */}
            <Reveal className="lg:col-span-12" delay={80}>
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><IconShield /></span>
                  <div>
                    <h3 className="text-[1.1875rem] font-semibold tracking-tight">Private by default, gone in 7 days</h3>
                    <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-dim">Lists are reachable only by their link and auto-delete after a week of inactivity.</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[0.8125rem] font-medium text-ink-dim"><IconClock /> Expires in 7 days</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="scroll-mt-16 border-t border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 py-24 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <p className="font-code text-[0.8rem] font-medium text-accent">INSTALL</p>
            <h2 className="mt-2 font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}>
              Add ClientPin to your browser.
            </h2>
            <p className="mt-4 max-w-sm text-[1rem] leading-relaxed text-ink-dim">
              ClientPin is not on the Chrome Web Store yet, so you install the build directly. It takes about a minute and works in any Chromium browser.
            </p>
            <a href="/clientpin.zip" className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[1rem] font-semibold text-accent-ink shadow-bar transition-colors hover:bg-accent-press">
              <IconDownload /> Download ClientPin (.zip)
            </a>
            <p className="mt-3 text-[0.8125rem] text-ink-mute">Keep the unzipped folder. Deleting it removes the extension.</p>
          </Reveal>

          <Reveal delay={100}>
            <ol className="flex flex-col gap-4">
              {[
                <>Download the <code className="font-code">.zip</code> above and unzip it.</>,
                <>Open <code className="font-code rounded bg-surface-2 px-1.5 py-0.5 text-accent">chrome://extensions</code> in your browser.</>,
                <>Turn on <b className="font-semibold text-ink">Developer mode</b> using the toggle in the top right.</>,
                <>Click <b className="font-semibold text-ink">Load unpacked</b> and select the unzipped <code className="font-code">clientpin</code> folder.</>,
                <>Pin ClientPin to your toolbar, open it, and create your first project.</>,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-4 rounded-xl border border-line bg-surface p-4 shadow-card">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[0.8125rem] font-semibold text-accent-ink">{i + 1}</span>
                  <span className="pt-0.5 text-[0.9375rem] leading-relaxed text-ink-dim">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 border-t border-line bg-surface-2">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <h2 className="font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Questions, answered.</h2>
          </Reveal>
          <div className="mt-10 flex flex-col gap-3">
            {FAQ.map(([q, a], i) => (
              <Reveal key={i} delay={i * 40}>
                <details className="group rounded-xl border border-line bg-surface px-5 py-4 shadow-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1rem] font-semibold text-ink">
                    {q}
                    <span className="text-ink-mute transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-dim">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-accent">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display font-bold leading-tight tracking-[-0.02em] text-accent-ink" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}>
              Stop describing bugs. Pin them.
            </h2>
            <p className="mt-2 text-[1rem] text-accent-ink/85">Install ClientPin and share your first list in minutes.</p>
          </div>
          <a href="/clientpin.zip" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-bg px-6 py-3.5 text-[1rem] font-semibold text-accent transition-transform hover:-translate-y-0.5">
            <IconDownload /> Download the extension
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-[0.8125rem] text-ink-mute">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-accent text-[0.65rem] font-bold text-accent-ink">C</span>
          <span className="font-display font-bold text-ink-dim">ClientPin</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#how" className="transition-colors hover:text-ink-dim">How it works</a>
          <a href="#features" className="transition-colors hover:text-ink-dim">Features</a>
          <a href="#install" className="transition-colors hover:text-ink-dim">Install</a>
          <a href="#faq" className="transition-colors hover:text-ink-dim">FAQ</a>
          <span>Lists expire after 7 days.</span>
        </div>
      </footer>
    </div>
  )
}
