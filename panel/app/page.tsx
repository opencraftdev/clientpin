import Link from 'next/link'
import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'

const sans = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-hanken' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jb' })

const monoFont = { fontFamily: 'var(--font-jb), ui-monospace, monospace' }

function Pin({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 32 / 24} viewBox="0 0 24 32" className={className} aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="var(--color-accent)" />
      <circle cx="12" cy="12" r="4.4" fill="var(--color-surface)" />
    </svg>
  )
}

export default function Landing() {
  return (
    <div className={`${sans.variable} ${mono.variable} min-h-screen overflow-x-hidden bg-bg text-ink`}
         style={{ fontFamily: 'var(--font-hanken), system-ui, sans-serif' }}>

      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-[0.8rem] font-bold text-accent-ink">C</span>
          <span className="text-[1.05rem] font-700 tracking-tight" style={{ fontWeight: 700 }}>ClientPin</span>
        </div>
        <a href="#install" className="rounded-full bg-ink px-4 py-2 text-[0.8125rem] font-medium text-bg transition-opacity hover:opacity-90">
          Install
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
        <div>
          <p className="rise mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[0.75rem] text-ink-dim"
             style={{ ...monoFont, animationDelay: '0ms' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Chrome extension for UI QA
          </p>
          <h1 className="rise font-800 leading-[0.98] tracking-[-0.03em]"
              style={{ fontWeight: 800, fontSize: 'clamp(2.75rem, 6.5vw, 4.75rem)', animationDelay: '80ms' }}>
            Point at the bug.<br />
            <span className="text-accent">Pin it.</span> Share it.
          </h1>
          <p className="rise mt-6 max-w-md text-[1.0625rem] leading-relaxed text-ink-dim" style={{ animationDelay: '160ms' }}>
            ClientPin lets you and your clients tag UI issues on any live site by clicking the element.
            Every pin becomes a screenshot, a status, and an AI-fix prompt, all shared as one link.
          </p>
          <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: '240ms' }}>
            <a href="#install"
               className="rounded-full bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-accent-ink shadow-bar transition-colors hover:bg-accent-press">
              Install the extension
            </a>
            <a href="#how" className="rounded-full px-5 py-2.5 text-[0.9375rem] font-medium text-ink-dim transition-colors hover:text-ink">
              How it works
            </a>
          </div>
          <p className="rise mt-4 text-[0.8125rem] text-ink-mute" style={{ animationDelay: '300ms' }}>
            Free. No account. Shareable lists expire after 7 days.
          </p>
        </div>

        {/* Product mockup = the imagery */}
        <div className="rise" style={{ animationDelay: '360ms' }}>
          <div className="relative rounded-2xl border border-line bg-surface shadow-card">
            {/* browser chrome */}
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
              <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
              <span className="ml-3 rounded-md bg-bg px-3 py-1 text-[0.7rem] text-ink-mute" style={monoFont}>acme.store/checkout</span>
            </div>
            {/* faux page */}
            <div className="space-y-4 p-6">
              <div className="h-2.5 w-24 rounded-full bg-line" />
              <div className="h-16 rounded-lg bg-surface-2" />
              <div className="flex gap-3">
                <div className="h-10 flex-1 rounded-lg bg-surface-2" />
                <div className="h-10 flex-1 rounded-lg bg-surface-2" />
              </div>
              {/* the tagged element */}
              <div className="relative w-fit">
                <div className="rounded-lg border-2 border-accent bg-accent-soft px-5 py-2.5 text-[0.8125rem] font-medium text-accent">
                  Checkout
                </div>
                <span className="absolute -right-2 -top-3"><Pin size={20} /></span>
                {/* comment bubble floats above the tagged element */}
                <div className="absolute bottom-[135%] left-0 w-52 rounded-xl border border-line bg-surface p-3 shadow-card">
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[0.6rem] font-bold text-accent-ink">C</span>
                    <span className="text-[0.7rem] font-medium text-ink-dim">Client</span>
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink">Button text overflows on mobile.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-20">
        <h2 className="max-w-lg text-[clamp(1.75rem,3.5vw,2.5rem)] font-700 leading-tight tracking-[-0.02em]" style={{ fontWeight: 700 }}>
          From a click to a shareable checklist.
        </h2>
        <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
          {[
            { n: '01', t: 'Tag a component', d: 'Pick or create a project in the extension, then click any element on a live page and leave a comment. A pin drops where you clicked.' },
            { n: '02', t: 'It captures the context', d: 'ClientPin grabs a screenshot of that exact component and remembers where it lives. No more "the button near the footer."' },
            { n: '03', t: 'Share one link', d: 'Send the list URL. Anyone can view each pin, jump to it on the live page, move it New to Resolved, and copy an AI-fix prompt.' },
          ].map((s) => (
            <div key={s.n}>
              <div className="text-[0.9rem] font-500 text-accent" style={{ ...monoFont, fontWeight: 500 }}>{s.n}</div>
              <h3 className="mt-3 text-[1.1875rem] font-600 tracking-tight" style={{ fontWeight: 600 }}>{s.t}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-dim">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="scroll-mt-8 border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-700 leading-tight tracking-[-0.02em]" style={{ fontWeight: 700 }}>
              Add ClientPin to Chrome.
            </h2>
            <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-ink-dim">
              ClientPin is not on the Chrome Web Store yet, so you install the build directly. It takes about a minute, and works in any Chromium browser.
            </p>
            <a href="/clientpin.zip"
               className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[0.9375rem] font-medium text-accent-ink shadow-bar transition-colors hover:bg-accent-press">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
              </svg>
              Download ClientPin (.zip)
            </a>
            <p className="mt-3 text-[0.8125rem] text-ink-mute">Keep the unzipped folder, deleting it removes the extension.</p>
          </div>

          <ol className="flex flex-col gap-5">
            {[
              <>Download the <code style={monoFont}>.zip</code> above and unzip it.</>,
              <>Open <code style={monoFont} className="rounded bg-bg px-1.5 py-0.5 text-accent">chrome://extensions</code> in your browser.</>,
              <>Turn on <b className="font-600" style={{ fontWeight: 600 }}>Developer mode</b> (toggle, top right).</>,
              <>Click <b className="font-600" style={{ fontWeight: 600 }}>Load unpacked</b> and select the unzipped <code style={monoFont}>clientpin</code> folder.</>,
              <>Pin ClientPin to your toolbar, open it, and create your first project.</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-bg text-[0.8125rem] font-600 text-ink" style={{ fontWeight: 600 }}>{i + 1}</span>
                <span className="pt-0.5 text-[0.9375rem] leading-relaxed text-ink-dim">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-[0.8125rem] text-ink-mute">
        <div className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-accent text-[0.65rem] font-bold text-accent-ink">C</span>
          <span className="font-600 text-ink-dim" style={{ fontWeight: 600 }}>ClientPin</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#how" className="transition-colors hover:text-ink-dim">How it works</a>
          <a href="#install" className="transition-colors hover:text-ink-dim">Install</a>
          <span>Lists expire after 7 days.</span>
        </div>
      </footer>
    </div>
  )
}
