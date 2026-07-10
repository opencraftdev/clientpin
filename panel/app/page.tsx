export default function Home() {
  return (
    <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-6 text-center">
      <div>
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-ink shadow-bar">
          <span className="text-[1.1rem] font-bold">C</span>
        </span>
        <h1 className="text-[1.5rem] font-medium tracking-tight text-ink">ClientPin</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-dim">
          Tag UI issues on any site with the browser extension, then share a link to the list. Links expire after 7 days of inactivity.
        </p>
      </div>
    </main>
  )
}
