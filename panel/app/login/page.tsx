import { signIn } from './actions'

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <div className="grid min-h-screen place-items-center px-6">
      {/* faint accent glow for depth */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(60rem 40rem at 50% -10%, oklch(0.86 0.19 128 / 0.06), transparent 70%)' }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-[6px] bg-accent text-accent-ink">
            <span className="text-[0.8rem] font-bold leading-none">Q</span>
          </span>
          <span className="text-[1rem] font-semibold tracking-tight">QA Tagger</span>
          <span className="mono text-[0.7rem] text-ink-mute">/admin</span>
        </div>

        <form action={signIn} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6">
          <div className="mb-1">
            <h1 className="text-[1.0625rem] font-semibold tracking-tight">Sign in</h1>
            <p className="mt-0.5 text-[0.8125rem] text-ink-mute">Access your QA projects.</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="mono text-[0.7rem] uppercase tracking-wide text-ink-mute">email</span>
            <input
              name="email" type="email" placeholder="you@team.com" required autoFocus
              className="mono ring-accent rounded-md border border-line bg-bg px-3 py-2 text-[0.875rem] placeholder:text-ink-mute focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="mono text-[0.7rem] uppercase tracking-wide text-ink-mute">password</span>
            <input
              name="password" type="password" placeholder="••••••••••" required
              className="mono ring-accent rounded-md border border-line bg-bg px-3 py-2 text-[0.875rem] placeholder:text-ink-mute focus:border-accent focus:outline-none"
            />
          </label>

          {error && (
            <p className="text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>
              Invalid credentials.
            </p>
          )}

          <button className="ring-accent mt-1 rounded-md bg-accent px-4 py-2 text-[0.875rem] font-medium text-accent-ink transition-[filter] hover:brightness-105 active:brightness-95">
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
