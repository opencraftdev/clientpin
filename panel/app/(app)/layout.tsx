import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'
import { NavLink } from './NavLink'
import { GridIcon, FolderIcon, PlusIcon, LogoutIcon } from './icons'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects').select('id, name').order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[15.5rem] flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-14 items-center gap-2.5 px-5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-ink">
            <span className="text-[0.85rem] font-bold leading-none">Q</span>
          </span>
          <span className="text-[0.95rem] font-medium tracking-tight text-ink">QA Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <NavLink href="/" exact icon={<GridIcon />}>Projects</NavLink>

          <div className="mt-5 mb-1 flex items-center justify-between px-3">
            <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-ink-mute">Your projects</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {projects?.map((p) => (
              <NavLink key={p.id} href={`/projects/${p.id}`} icon={<FolderIcon />}>{p.name}</NavLink>
            ))}
            {!projects?.length && (
              <p className="px-3 py-1 text-[0.8125rem] text-ink-mute">No projects yet.</p>
            )}
          </div>

          <Link
            href="/"
            className="ring-accent mt-2 flex items-center gap-3 rounded-full px-3 py-2 text-[0.875rem] font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            <span className="grid h-5 w-5 place-items-center"><PlusIcon /></span>
            New project
          </Link>
        </nav>
      </aside>

      {/* Content column */}
      <div className="flex min-h-screen flex-1 flex-col md:ml-[15.5rem]">
        <header className="shadow-bar sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-surface px-6">
          <Link href="/" className="ring-accent flex items-center gap-2 md:hidden">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-accent-ink text-[0.75rem] font-bold">Q</span>
            <span className="font-medium text-ink">QA Admin</span>
          </Link>
          <div className="hidden md:block" />
          <form action={signOut}>
            <button className="ring-accent flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink">
              <LogoutIcon />
              <span>Sign out</span>
            </button>
          </form>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
