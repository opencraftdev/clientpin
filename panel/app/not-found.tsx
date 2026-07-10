export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-6 text-center">
      <div>
        <h1 className="text-[1.25rem] font-medium text-ink">List not found</h1>
        <p className="mt-1 text-[0.875rem] text-ink-dim">This list does not exist or has expired.</p>
      </div>
    </main>
  )
}
