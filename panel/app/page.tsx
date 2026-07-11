import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Nav } from './_landing/Nav'
import { Reveal } from './_landing/Reveal'
import { CopyPrompt } from './_landing/CopyPrompt'
import {
  Pin, Logo, ListPreview, Thumb, StatusChip,
  IconDownload, IconCamera, IconLocate, IconLink, IconShield, IconSparkle, IconCheck, IconClock,
} from './_landing/parts'

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-bricolage' })
const body = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-hanken' })
const codeFont = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jb' })

// blue / amber / green — the product's own triad, used to color sections
const T = [
  { fg: 'var(--color-progress)', soft: 'var(--color-progress-soft)' },
  { fg: 'var(--color-new)', soft: 'var(--color-new-soft)' },
  { fg: 'var(--color-resolved)', soft: 'var(--color-resolved-soft)' },
]

const DOWNLOAD = 'https://drive.google.com/uc?export=download&id=1XHm9djpq5ZNtRk7Z-SxFeykEQgx6xr8n'

const PROMPT = `Fix this UI issue on /checkout:
Problem: "Button text overflows on mobile"
Element: <button.cta>`

const STEPS = [
  { t: 'Tag it in a click', d: 'Turn on tag mode, hover to highlight the exact component, click it, and leave a comment in the bubble.', c: T[1],
    v: (<div className="relative w-fit"><span className="rounded-md bg-accent px-4 py-1.5 text-[0.7rem] font-semibold text-accent-ink outline outline-2 outline-offset-2" style={{ outlineColor: 'var(--color-accent)' }}>Checkout</span><span className="absolute -right-2 -top-3"><Pin size={16} /></span></div>) },
  { t: 'Get a shareable list', d: 'ClientPin captures a screenshot and the element location, then turns your project into one public link. No accounts for viewers.', c: T[0],
    v: (<div className="w-full space-y-1.5">{[0, 1].map((i) => (<div key={i} className="flex items-center gap-2 rounded-md border border-line bg-bg px-2 py-1.5"><span className="h-4 w-6 rounded bg-surface-2" /><span className="h-1.5 flex-1 rounded-full bg-line" /><span className="h-1.5 w-8 rounded-full" style={{ background: i ? 'var(--color-resolved)' : 'var(--color-new)' }} /></div>))}</div>) },
  { t: 'Fix and resolve', d: 'Anyone jumps to the live element, moves each item through its status, and copies an AI-fix prompt. Lists auto-delete in 7 days.', c: T[2],
    v: (<div className="flex flex-wrap items-center gap-1.5"><StatusChip status="new" /><span className="text-ink-mute">→</span><StatusChip status="resolved" /></div>) },
]

const FEATURES = [
  { icon: <IconCamera />, t: 'Pinpoint screenshots', d: 'Every tag captures a cropped image of the exact component, not the whole page.', c: T[0], v: <div className="flex justify-center pt-1"><Thumb kind="button" /></div> },
  { icon: <IconLocate />, t: 'Jump to the live element', d: 'Click a pin to open the page and scroll straight to the component it marks.', c: T[1], v: <div className="flex items-center gap-2 pt-1"><span style={{ color: 'var(--color-new)' }}><Pin size={16} /></span><span className="h-2 flex-1 rounded-full bg-line" /></div> },
  { icon: <IconCheck />, t: 'A status for every pin', d: 'Move items New to In progress to Resolved. Anyone with the link can update.', c: T[2], v: <div className="flex flex-wrap gap-1.5 pt-1"><StatusChip status="new" /><StatusChip status="in_progress" /><StatusChip status="resolved" /></div> },
  { icon: <IconSparkle />, t: 'One-click AI-fix prompts', d: 'Copy a ready-to-paste prompt with the comment, selector, and page baked in.', c: T[0], v: (<div className="rounded-lg border border-line bg-bg p-2.5"><div className="flex justify-end"><CopyPrompt text={PROMPT} /></div><pre className="font-code mt-1 overflow-hidden text-[0.65rem] leading-relaxed text-ink-dim">{PROMPT}</pre></div>) },
  { icon: <IconLink />, t: 'Share by link, no accounts', d: 'Send one URL. Clients and developers just open it, nothing to sign up for.', c: T[1], v: <div className="font-code inline-flex items-center rounded-lg border border-line bg-bg px-3 py-1.5 text-[0.7rem] text-ink-dim">clientpin.app/<span style={{ color: 'var(--color-accent)' }}>HDc7dS5F2s</span></div> },
  { icon: <IconShield />, t: 'Private, gone in 7 days', d: 'Lists are reachable only by their link and auto-delete after a week of inactivity.', c: T[2], v: <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.75rem] font-medium" style={{ backgroundColor: 'var(--color-resolved-soft)', color: 'var(--color-resolved)' }}><IconClock /> Expires in 7 days</span> },
]

const FAQ = [
  ['Is it free?', 'Yes. ClientPin is free to install and use. There are no accounts and no paywall.'],
  ['Do I or my clients need an account?', 'No. You create projects from the extension, and anyone with a list link can view it and change statuses.'],
  ['What data is stored?', 'Only what you tag: the comment, a screenshot of the component, its page URL, and its location on the page.'],
  ['Why is it not on the Chrome Web Store yet?', 'It is in review. For now you install the build directly, which takes about a minute. See the steps above.'],
  ['What happens after 7 days?', 'A list is deleted 7 days after its last activity, including its screenshots. Add or update a tag to keep it alive.'],
  ['Which browsers work?', 'Any Chromium browser: Chrome, Edge, Brave, Arc, and Opera.'],
]

export default function Landing() {
  return (
    <div id="top" className={`${display.variable} ${body.variable} ${codeFont.variable} font-body min-h-screen overflow-x-hidden bg-bg text-ink`}>
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/hero-bg.svg')] bg-cover bg-top" />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 52%, var(--color-bg))' }} />
        <div className="relative mx-auto max-w-3xl px-6 pt-16 text-center lg:pt-24">
          <p className="rise mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[0.75rem] text-ink-dim" style={{ animationDelay: '0ms' }}>
            <Pin size={13} /> Chrome extension for UI QA and client feedback
          </p>
          <h1 className="rise font-display font-extrabold leading-[0.95] tracking-[-0.03em]" style={{ fontSize: 'clamp(2.9rem, 7vw, 5.25rem)', animationDelay: '80ms' }}>
            Point at the bug.<br /><span className="text-accent">Pin it.</span> Share it.
          </h1>
          <p className="rise mx-auto mt-6 max-w-xl text-[1.125rem] leading-relaxed text-ink-dim" style={{ animationDelay: '160ms' }}>
            Tag UI issues on any live site just by clicking the element. Every pin becomes a screenshot, a status, and an AI-fix prompt, shared as one link.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '240ms' }}>
            <a href="/login" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[0.9375rem] font-semibold text-accent-ink shadow-bar transition-colors hover:bg-accent-press">Try now, it's free</a>
            <a href="#how" className="rounded-full border border-line bg-surface px-5 py-3 text-[0.9375rem] font-medium text-ink-dim transition-colors hover:text-ink">See how it works</a>
          </div>
          <div className="rise mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.8125rem] text-ink-mute" style={{ animationDelay: '300ms' }}>
            {['Free', 'No account', 'Works in Chrome, Edge, Brave'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5"><span className="text-accent"><IconCheck /></span> {t}</span>
            ))}
          </div>
        </div>
        {/* Concrete product shot */}
        <div className="relative mx-auto mt-14 max-w-4xl px-6">
          <div className="rise" style={{ animationDelay: '380ms' }}><ListPreview /></div>
        </div>
        {/* Powered by */}
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-6 text-center">
          <a href="https://ocraft.id/" target="_blank" rel="noreferrer noopener"
             className="inline-flex items-center gap-1.5 text-[0.8125rem] text-ink-mute transition-colors hover:text-ink-dim">
            Powered by <span className="font-semibold text-ink-dim">Opencraft</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17L17 7M9 7h8v8" /></svg>
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 border-t border-line bg-surface-2">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="text-center">
            <p className="font-code text-[0.8rem] font-medium text-accent">HOW IT WORKS</p>
            <h2 className="mx-auto mt-2 max-w-2xl font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Three steps, one link.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full text-[0.9rem] font-bold font-display" style={{ backgroundColor: s.c.soft, color: s.c.fg }}>{i + 1}</span>
                    <h3 className="text-[1.125rem] font-semibold tracking-tight">{s.t}</h3>
                  </div>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-dim">{s.d}</p>
                  <div className="mt-5 flex min-h-[72px] items-center rounded-xl border border-line p-4" style={{ backgroundColor: s.c.soft }}>{s.v}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}><p className="mt-6 flex items-center justify-center gap-2 text-[0.8125rem] text-ink-mute"><IconClock /> Lists auto-delete 7 days after the last activity, so nothing lingers.</p></Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal className="text-center">
            <p className="font-code text-[0.8rem] font-medium text-accent">FEATURES</p>
            <h2 className="mx-auto mt-2 max-w-2xl font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Everything a good bug report needs.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={(i % 3) * 70}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
                  <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: f.c.soft, color: f.c.fg }}>{f.icon}</span>
                  <h3 className="mt-4 text-[1.125rem] font-semibold tracking-tight">{f.t}</h3>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-dim">{f.d}</p>
                  <div className="mt-5 flex flex-1 items-end">{f.v}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="install" className="scroll-mt-16 border-t border-line bg-surface-2">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 py-24 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <p className="font-code text-[0.8rem] font-medium text-accent">INSTALL</p>
            <h2 className="mt-2 font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Add ClientPin to your browser.</h2>
            <p className="mt-4 max-w-sm text-[1rem] leading-relaxed text-ink-dim">Not on the Chrome Web Store yet, so you install the build directly. It takes about a minute and works in any Chromium browser.</p>
            <a href={DOWNLOAD} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[1rem] font-semibold text-accent-ink shadow-bar transition-colors hover:bg-accent-press"><IconDownload /> Download ClientPin (.zip)</a>
            <p className="mt-3 text-[0.8125rem] text-ink-mute">Keep the unzipped folder. Deleting it removes the extension.</p>
          </Reveal>
          <Reveal delay={100}>
            <ol className="flex flex-col gap-3">
              {[
                <>Download the <code className="font-code">.zip</code> above and unzip it.</>,
                <>Open <code className="font-code rounded bg-surface-2 px-1.5 py-0.5 text-accent">chrome://extensions</code> in your browser.</>,
                <>Turn on <b className="font-semibold text-ink">Developer mode</b> (toggle, top right).</>,
                <>Click <b className="font-semibold text-ink">Load unpacked</b> and select the <code className="font-code">clientpin</code> folder.</>,
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
      <section id="faq" className="scroll-mt-16 border-t border-line">
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

      {/* Final CTA */}
      <section className="bg-accent">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display font-bold leading-tight tracking-[-0.02em] text-accent-ink" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)' }}>Stop describing bugs. Pin them.</h2>
            <p className="mt-2 text-[1rem] text-accent-ink/85">Install ClientPin and share your first list in minutes.</p>
          </div>
          <a href={DOWNLOAD} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-bg px-6 py-3.5 text-[1rem] font-semibold text-accent transition-transform hover:-translate-y-0.5"><IconDownload /> Download the extension</a>
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
          <span>Lists expire after 7 days.</span>
        </div>
      </footer>
    </div>
  )
}
