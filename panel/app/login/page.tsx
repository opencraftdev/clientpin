import { signInWithGoogle } from './actions'

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-ink shadow-bar">
          <span className="text-[1.2rem] font-bold">C</span>
        </span>
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-ink">Sign in to ClientPin</h1>
        <p className="mt-1 text-[0.875rem] text-ink-dim">Create and manage your projects.</p>
        {error && <p className="mt-3 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>Sign-in failed. Try again.</p>}
        <form action={signInWithGoogle} className="mt-6">
          <button className="ring-accent w-full rounded-lg border border-line bg-surface px-4 py-3 text-[0.9375rem] font-medium text-ink shadow-bar transition-colors hover:bg-surface-2">
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  )
}
