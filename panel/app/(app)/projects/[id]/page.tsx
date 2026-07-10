import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusSelect } from './StatusSelect'
import { CopyKey } from '../../CopyKey'
import { STATUS_META, type Status, type Tag } from '@/lib/tags'

const FILTERS: { label: string; value?: Status }[] = [
  { label: 'All' },
  { label: 'New', value: 'new' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
]

function pathOf(url: string): string {
  try { return new URL(url).pathname || '/' } catch { return url }
}

export default async function ProjectDetail(
  { params, searchParams }:
  { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }
) {
  const { id } = await params
  const { status } = await searchParams
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects').select('name, site_url, project_key').eq('id', id).single()

  let q = supabase.from('tags').select('*').eq('project_id', id)
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data } = await q
  const tags = (data ?? []) as Tag[]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <nav className="text-[0.8125rem] text-ink-mute">
          <Link href="/" className="ring-accent transition-colors hover:text-accent">Projects</Link>
          <span className="px-1.5">/</span>
          <span className="text-ink-dim">{project?.name ?? 'Project'}</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[1.5rem] font-medium tracking-tight text-ink">{project?.name ?? 'Project'}</h1>
          {project?.project_key && (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5">
              <span className="text-[0.75rem] text-ink-mute">Key</span>
              <CopyKey value={project.project_key} />
            </div>
          )}
        </div>
        {project?.site_url && (
          <a href={project.site_url} target="_blank" rel="noreferrer"
             className="mono ring-accent w-fit text-[0.8125rem] text-accent transition-colors hover:underline">
            {project.site_url}
          </a>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (f.value ?? undefined) === (status as Status | undefined) || (!f.value && !status)
          return (
            <Link
              key={f.label}
              href={f.value ? `?status=${f.value}` : '?'}
              className={`ring-accent rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-medium transition-colors ${
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-surface text-ink-dim hover:bg-surface-2 hover:text-ink'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Tags table card */}
      {tags.length ? (
        <div className="shadow-card overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[0.6875rem] uppercase tracking-wide text-ink-mute">
                <th className="px-5 py-3 font-medium">Comment</th>
                <th className="px-5 py-3 font-medium">Element</th>
                <th className="px-5 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0 align-top transition-colors hover:bg-surface-2">
                  <td className="px-5 py-3.5 text-[0.9375rem] text-ink">{t.comment}</td>
                  <td className="mono px-5 py-3.5 text-[0.75rem] text-ink-dim">
                    {pathOf(t.page_url)} <span className="text-ink-mute">·</span> &lt;{t.anchor?.tagName ?? 'el'}&gt;
                  </td>
                  <td className="px-5 py-3 text-right"><StatusSelect tagId={t.id} value={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="shadow-card rounded-xl border border-line bg-surface px-6 py-14 text-center">
          <p className="text-[0.9375rem] font-medium text-ink">
            {status ? `No ${status.replace('_', ' ')} tags` : 'No tags yet'}
          </p>
          {!status && (
            <p className="mt-1 text-[0.8125rem] text-ink-dim">
              Share the project key with your client to start collecting tags.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
