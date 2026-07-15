import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { progressPct, type Milestone } from '@/lib/dashboard'
import { signOut } from '../login/actions'
import { Logo } from '../_landing/parts'
import { DeleteProjectButton } from './DeleteProjectButton'

type Row = { slug: string; name: string; description: string | null; created_at: string; milestones: Milestone[] | null }

// Progress % is hidden for now (onboarding skips milestones). Flip to restore.
const SHOW_PROGRESS = false

export default async function Projects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.from('projects')
    .select('slug, name, description, created_at, milestones')
    .eq('owner', user.id).order('created_at', { ascending: false })
  const projects = (data ?? []) as Row[]
  // First-time owners have nothing to list — send them straight to setup.
  if (projects.length === 0) redirect('/onboarding')

  return (
    <div className="grid-paper min-h-screen">
      <header className="border-b border-line bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <a href="/" aria-label="ClientPin home"><Logo size={22} /></a>
          <div className="flex items-center gap-3">
            {user.email && <span className="font-code hidden text-[0.72rem] text-ink-mute sm:inline">{user.email}</span>}
            <form action={signOut}><button className="ring-accent border border-line px-3 py-1.5 text-[0.8125rem] font-medium text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink">Sign out</button></form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-code text-[0.72rem] font-semibold uppercase tracking-wide text-accent">Your workspace</p>
            <h1 className="font-display mt-1 text-[2rem] font-bold leading-none tracking-[-0.02em] text-ink">Projects</h1>
          </div>
          <a href="/onboarding" className="ring-accent shrink-0 bg-accent px-4 py-2.5 text-[0.875rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press">+ New project</a>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const pct = progressPct(p.milestones ?? [])
            return (
              <li key={p.slug} className="group relative">
                <a href={`/${p.slug}`} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-colors hover:border-line-2">
                  <h2 className="font-display pr-10 text-[1.25rem] font-bold leading-tight tracking-[-0.01em] text-ink">{p.name}</h2>
                  {p.description && <p className="mt-2 line-clamp-2 text-[0.875rem] leading-relaxed text-ink-dim">{p.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <span className="font-code text-[0.7rem] text-ink-mute">Created {new Date(p.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-3">
                      {SHOW_PROGRESS && <span className="font-display text-[1.25rem] font-extrabold leading-none text-accent">{pct}<span className="text-[0.8rem]">%</span></span>}
                      <span className="text-[0.8125rem] font-semibold text-accent transition-transform group-hover:translate-x-0.5">Open →</span>
                    </span>
                  </div>
                </a>
                <DeleteProjectButton slug={p.slug} name={p.name} />
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
