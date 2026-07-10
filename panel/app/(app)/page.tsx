import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createProject } from './actions'
import { CopyKey } from './CopyKey'

export default async function Projects() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects').select('id, name, site_url, project_key')
    .order('created_at', { ascending: false })

  const { data: tagRows } = await supabase.from('tags').select('project_id')
  const counts = new Map<string, number>()
  tagRows?.forEach((t) => counts.set(t.project_id, (counts.get(t.project_id) ?? 0) + 1))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.5rem] font-medium tracking-tight text-ink">Projects</h1>
        <p className="mt-0.5 text-[0.875rem] text-ink-dim">
          Create a project, share its key with a client, and triage the tags they report.
        </p>
      </div>

      {/* Create card — inline, no modal */}
      <form action={createProject} className="shadow-card flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-[0.75rem] font-medium text-ink-dim">Project name</span>
          <input
            name="name" placeholder="Acme Store" required
            className="ring-accent rounded-lg border border-line bg-surface px-3 py-2 text-[0.875rem] placeholder:text-ink-mute focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-[0.75rem] font-medium text-ink-dim">Site URL</span>
          <input
            name="site_url" type="url" placeholder="https://acme.store" required
            className="mono ring-accent rounded-lg border border-line bg-surface px-3 py-2 text-[0.8125rem] placeholder:text-ink-mute focus:border-accent focus:outline-none"
          />
        </label>
        <button className="ring-accent shadow-bar rounded-lg bg-accent px-5 py-2 text-[0.875rem] font-medium text-accent-ink transition-colors hover:bg-accent-press">
          Create project
        </button>
      </form>

      {/* Projects table card */}
      {projects?.length ? (
        <div className="shadow-card overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[0.6875rem] uppercase tracking-wide text-ink-mute">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Project key</th>
                <th className="px-5 py-3 text-right font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="group border-b border-line last:border-0 transition-colors hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <Link href={`/projects/${p.id}`} className="ring-accent block">
                      <span className="font-medium text-ink group-hover:text-accent">{p.name}</span>
                      <span className="mono block text-[0.75rem] text-ink-dim">{p.site_url}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3"><CopyKey value={p.project_key} /></td>
                  <td className="px-5 py-3 text-right text-[0.8125rem] text-ink-dim">
                    {counts.get(p.id) ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="shadow-card rounded-xl border border-line bg-surface px-6 py-14 text-center">
          <p className="text-[0.9375rem] font-medium text-ink">No projects yet</p>
          <p className="mt-1 text-[0.8125rem] text-ink-dim">
            Create your first project above to get a key for the extension.
          </p>
        </div>
      )}
    </div>
  )
}
