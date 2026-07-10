import { signIn } from './actions'

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-ink shadow-bar">
            <span className="text-[1.1rem] font-bold leading-none">Q</span>
          </span>
          <div>
            <h1 className="text-[1.25rem] font-medium tracking-tight text-ink">QA Admin</h1>
            <p className="mt-0.5 text-[0.8125rem] text-ink-dim">Sign in to manage your projects</p>
          </div>
        </div>

        <form action={signIn} className="shadow-card flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.75rem] font-medium text-ink-dim">Email</span>
            <input
              name="email" type="email" placeholder="you@team.com" required autoFocus
              className="ring-accent rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.875rem] placeholder:text-ink-mute focus:border-accent focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.75rem] font-medium text-ink-dim">Password</span>
            <input
              name="password" type="password" placeholder="••••••••••" required
              className="ring-accent rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.875rem] placeholder:text-ink-mute focus:border-accent focus:outline-none"
            />
          </label>

          {error && (
            <p className="text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>
              Invalid email or password.
            </p>
          )}

          <button className="ring-accent shadow-bar mt-1 rounded-lg bg-accent px-4 py-2.5 text-[0.875rem] font-medium text-accent-ink transition-colors hover:bg-accent-press">
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
