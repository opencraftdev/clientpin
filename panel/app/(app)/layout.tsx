import Link from 'next/link'
import { signOut } from './actions'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="ring-accent flex items-center gap-2.5">
            <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-accent text-accent-ink">
              <span className="text-[0.7rem] font-bold leading-none">Q</span>
            </span>
            <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">QA Tagger</span>
            <span className="mono hidden text-[0.7rem] text-ink-mute sm:inline">/admin</span>
          </Link>
          <form action={signOut}>
            <button className="ring-accent rounded-md px-2.5 py-1 text-[0.8125rem] text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-9">{children}</main>
    </>
  )
}
