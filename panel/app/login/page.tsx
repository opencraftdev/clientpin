import { signInWithGoogle } from './actions'
import { Logo } from '../_landing/parts'

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <div className="grid-paper grid min-h-screen place-items-center px-6">
      <div className="reg-marks w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="flex justify-center"><Logo size={30} /></div>
        <h1 className="font-display mt-6 text-[1.5rem] font-bold tracking-tight text-ink">Sign in</h1>
        <p className="mt-1.5 text-[0.9375rem] text-ink-dim">Create and manage your projects.</p>
        {error && <p className="mt-3 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>Sign-in failed. Try again.</p>}
        <form action={signInWithGoogle} className="mt-7">
          <button className="ring-accent flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-[0.9375rem] font-semibold text-ink shadow-bar transition-colors hover:bg-surface-2">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Continue with Google
          </button>
        </form>
        <p className="mt-6 text-[0.75rem] text-ink-mute">Viewers never sign in. They open a link and a password.</p>
      </div>
    </div>
  )
}
