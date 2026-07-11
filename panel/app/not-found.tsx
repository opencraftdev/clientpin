import { Logo } from './_landing/parts'

export default function NotFound() {
  return (
    <main className="grid-paper grid min-h-screen place-items-center px-6 text-center">
      <div>
        <div className="flex justify-center"><Logo size={26} /></div>
        <p className="font-display mt-8 text-[3.5rem] font-extrabold leading-none tracking-[-0.03em] text-accent">404</p>
        <h1 className="font-display mt-3 text-[1.375rem] font-bold tracking-tight text-ink">List not found</h1>
        <p className="mt-1.5 text-[0.9375rem] text-ink-dim">This list does not exist or has expired.</p>
        <a href="/" className="mt-6 inline-block rounded-full border border-line bg-surface px-5 py-2 text-[0.875rem] font-semibold text-ink-dim shadow-bar transition-colors hover:bg-surface-2 hover:text-ink">Back to home</a>
      </div>
    </main>
  )
}
