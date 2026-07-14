import { Reveal } from './Reveal'

const DISCORD_URL = 'https://discord.gg/aAGFsrHs6z'

// Short testimonials about ClientPin shown as a comment wall.
const COMMENTS: { handle: string; text: string }[] = [
  { handle: 'maya_builds', text: "Stopped typing 'the button on the left, no the other one' in Slack. I just pin it now." },
  { handle: 'devonqa', text: 'My clients actually use the link — no logins, no Loom, just click and comment.' },
  { handle: 'frontend_fox', text: 'The AI-fix prompt drops into Cursor with the selector already filled. Wild.' },
  { handle: 'studio_ren', text: 'Went from 40 back-and-forth emails to one shareable list per release.' },
  { handle: 'kaipixels', text: 'Pinning the exact element beats a blurry cropped screenshot every single time.' },
  { handle: 'nourships', text: 'Lists auto-delete after a week, so my QA board never turns into a graveyard.' },
  { handle: 'tomdesigns', text: 'Set it up in a minute and shared it with a client who has never touched a dev tool.' },
  { handle: 'agencyalex', text: 'Triage is just moving pins New → In progress → Resolved. My PM finally gets it.' },
]

function DiscordMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.32 4.57A19.8 19.8 0 0 0 15.4 3.04a.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.26a18.3 18.3 0 0 0-5.42 0c-.17-.4-.41-.88-.62-1.26a.08.08 0 0 0-.08-.04A19.7 19.7 0 0 0 3.66 4.57a.07.07 0 0 0-.03.03C.53 9.2-.32 13.7.1 18.15a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.29 1.23-1.99a.08.08 0 0 0-.04-.11c-.65-.25-1.27-.55-1.87-.9a.08.08 0 0 1 0-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.11c.37.7.78 1.36 1.23 1.99a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.15-.84-9.6-3.54-13.55a.06.06 0 0 0-.03-.03ZM8.02 15.44c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.41-2.16 2.41Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.94 2.41-2.16 2.41Z" />
    </svg>
  )
}

export function Community() {
  return (
    <section id="community" className="scroll-mt-16 bg-ink text-bg">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="text-center">
          <p className="font-code text-[0.8rem] font-medium text-accent">COMMUNITY</p>
          <h2 className="mx-auto mt-2 max-w-2xl font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Join the community</h2>
          <p className="mx-auto mt-3 max-w-xl text-[1rem] leading-relaxed text-bg/70">See what teams building with ClientPin are saying, ask questions, and shape what ships next.</p>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="mt-7 inline-flex items-center gap-2.5 bg-accent px-6 py-3 text-[0.9375rem] font-semibold text-accent-ink transition-transform hover:-translate-y-0.5">
            <DiscordMark /> Join us on Discord
          </a>
        </Reveal>

        <div className="mt-14 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {COMMENTS.map((c, i) => (
            <Reveal key={c.handle} delay={(i % 3) * 60}>
              <figure className="mb-4 break-inside-avoid border border-bg/15 bg-bg/[0.04] p-5">
                <figcaption className="flex items-center gap-2.5">
                  <span className="font-display grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[0.8125rem] font-bold text-accent-ink">{c.handle[0].toUpperCase()}</span>
                  <span className="font-code text-[0.8125rem] text-bg/80">@{c.handle}</span>
                </figcaption>
                <blockquote className="mt-3 text-[0.9375rem] leading-relaxed text-bg/90">{c.text}</blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
