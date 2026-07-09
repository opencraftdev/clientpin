import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createProject } from './actions'
import { CopyKey } from './CopyKey'

export default async function Projects() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects').select('id, name, site_url, project_key')
    .order('created_at', { ascending: false })

  // One extra query; RLS already scopes tags to this owner's projects.
  const { data: tagRows } = await supabase.from('tags').select('project_id')
  const counts = new Map<string, number>()
  tagRows?.forEach((t) => counts.set(t.project_id, (counts.get(t.project_id) ?? 0) + 1))

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[1.375rem] font-semibold tracking-tight">Projects</h1>
        <span className="mono text-[0.75rem] text-ink-mute">{projects?.length ?? 0} total</span>
      </div>

      {/* Inline create — no modal */}
      <form
        action={createProject}
        className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-3 sm:flex-row sm:items-center"
      >
        <span aria-hidden className="mono px-1 text-accent">+</span>
        <input
          name="name" placeholder="Project name" required
          className="ring-accent min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-2 text-[0.875rem] placeholder:text-ink-mute focus:border-accent focus:outline-none"
        />
        <input
          name="site_url" type="url" placeholder="https://client-site.com" required
          className="mono ring-accent min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-2 text-[0.8125rem] placeholder:text-ink-mute focus:border-accent focus:outline-none"
        />
        <button className="ring-accent rounded-md bg-accent px-4 py-2 text-[0.875rem] font-medium text-accent-ink transition-[filter] hover:brightness-105 active:brightness-95">
          Create
        </button>
      </form>

      {projects?.length ? (
        <ul className="overflow-hidden rounded-lg border border-line">
          {projects.map((p, i) => (
            <li
              key={p.id}
              className={`group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface ${
                i > 0 ? 'border-t border-line' : ''
              }`}
            >
              <Link href={`/projects/${p.id}`} className="ring-accent min-w-0 flex-1">
                <div className="truncate text-[0.9375rem] font-medium text-ink group-hover:text-accent">
                  {p.name}
                </div>
                <div className="mono truncate text-[0.75rem] text-ink-dim">{p.site_url}</div>
              </Link>
              <CopyKey value={p.project_key} />
              <span className="mono w-16 shrink-0 text-right text-[0.75rem] text-ink-mute">
                {counts.get(p.id) ?? 0} {(counts.get(p.id) ?? 0) === 1 ? 'tag' : 'tags'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <p className="text-[0.9375rem] text-ink-dim">No projects yet.</p>
          <p className="mt-1 text-[0.8125rem] text-ink-mute">
            Create one to get a project key for the extension.
          </p>
        </div>
      )}
    </div>
  )
}
