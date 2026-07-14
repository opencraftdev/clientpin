import { Reveal } from './Reveal'

const DISCORD_URL = 'https://discord.gg/aAGFsrHs6z'

// Illustrative testimonials about ClientPin, shown as a social-proof wall.
const POSTS: { name: string; handle: string; text: string }[] = [
  { name: 'Maya Okonkwo', handle: 'maya_builds', text: "Stopped typing 'the button on the left, no the other one' in Slack. I just pin it now." },
  { name: 'Devon Ruiz', handle: 'devonqa', text: 'My clients actually use the link. No logins, no Loom, just click and comment.' },
  { name: 'Priya Nair', handle: 'frontend_fox', text: 'The AI-fix prompt drops into Cursor with the selector already filled. Genuinely wild.' },
  { name: 'Ren Aoki', handle: 'studio_ren', text: 'Went from 40 back-and-forth emails to one shareable list per release.' },
  { name: 'Kai Bergstrom', handle: 'kaipixels', text: 'Pinning the exact element beats a blurry cropped screenshot every single time.' },
  { name: 'Nour Haddad', handle: 'nourships', text: 'Lists auto-delete after a week, so my QA board never turns into a graveyard.' },
  { name: 'Tom Whitfield', handle: 'tomdesigns', text: 'Set it up in a minute and shared it with a client who had never touched a dev tool.' },
  { name: 'Alex Moreau', handle: 'agencyalex', text: 'Triage is just dragging pins New, In progress, Resolved. My PM finally gets it.' },
]

function XMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function DiscordMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.32 4.57A19.8 19.8 0 0 0 15.4 3.04a.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.26a18.3 18.3 0 0 0-5.42 0c-.17-.4-.41-.88-.62-1.26a.08.08 0 0 0-.08-.04A19.7 19.7 0 0 0 3.66 4.57a.07.07 0 0 0-.03.03C.53 9.2-.32 13.7.1 18.15a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.29 1.23-1.99a.08.08 0 0 0-.04-.11c-.65-.25-1.27-.55-1.87-.9a.08.08 0 0 1 0-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.11c.37.7.78 1.36 1.23 1.99a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.15-.84-9.6-3.54-13.55a.06.06 0 0 0-.03-.03ZM8.02 15.44c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.41-2.16 2.41Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.94 2.41-2.16 2.41Z" />
    </svg>
  )
}

export function Community() {
  return (
    <section id="community" className="scroll-mt-16 border-t border-line bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-code text-[0.8rem] font-medium text-accent">COMMUNITY</p>
          <h2 className="mt-2 font-display font-bold leading-tight tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Join the community</h2>
          <p className="mx-auto mt-3 max-w-xl text-[1.0625rem] leading-relaxed text-ink-dim">Discover what teams shipping with ClientPin are saying. Ask questions, trade workflows, and help shape what lands next.</p>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer noopener" className="shadow-edge mt-8 inline-flex items-center gap-2.5 bg-accent px-6 py-3 text-[0.9375rem] font-semibold text-accent-ink transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
            <DiscordMark /> Join us on Discord
          </a>
        </Reveal>

        {/* Testimonial wall — masonry so cards keep their natural height */}
        <div className="mt-16 gap-4 sm:columns-2 lg:columns-3">
          {POSTS.map((p, i) => (
            <Reveal key={p.handle} delay={(i % 3) * 70}>
              <figure className="mb-4 break-inside-avoid border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-2">
                <div className="flex items-start justify-between gap-3">
                  <figcaption className="flex items-center gap-2.5">
                    <span className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-[0.8125rem] font-bold text-ink-dim">{p.name[0]}</span>
                    <span className="leading-tight">
                      <span className="block text-[0.875rem] font-semibold text-ink">{p.name}</span>
                      <span className="font-code block text-[0.72rem] text-ink-mute">@{p.handle}</span>
                    </span>
                  </figcaption>
                  <span className="mt-0.5 shrink-0 text-ink-mute"><XMark /></span>
                </div>
                <blockquote className="mt-3.5 text-[0.9375rem] leading-relaxed text-ink-dim">{p.text}</blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
