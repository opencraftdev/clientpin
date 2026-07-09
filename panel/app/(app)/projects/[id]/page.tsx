import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusSelect } from './StatusSelect'
import { CopyKey } from '../../CopyKey'
import { STATUS_META, type Status, type Tag } from '@/lib/tags'

const FILTERS: { label: string; value?: Status }[] = [
  { label: 'all' },
  { label: 'new', value: 'new' },
  { label: 'in progress', value: 'in_progress' },
  { label: 'resolved', value: 'resolved' },
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
      <div className="flex flex-col gap-3">
        <Link href="/" className="ring-accent mono w-fit text-[0.75rem] text-ink-mute transition-colors hover:text-ink-dim">
          ← projects
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[1.375rem] font-semibold tracking-tight">{project?.name ?? 'Project'}</h1>
          {project?.project_key && <CopyKey value={project.project_key} />}
        </div>
        {project?.site_url && (
          <a href={project.site_url} target="_blank" rel="noreferrer"
             className="mono ring-accent w-fit text-[0.75rem] text-ink-dim transition-colors hover:text-accent">
            {project.site_url}
          </a>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = (f.value ?? undefined) === (status as Status | undefined) ||
            (!f.value && !status)
          const meta = f.value ? STATUS_META[f.value] : null
          return (
            <Link
              key={f.label}
              href={f.value ? `?status=${f.value}` : '?'}
              className={`ring-accent inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[0.8125rem] transition-colors ${
                active
                  ? 'border-line-2 bg-surface-2 text-ink'
                  : 'border-line text-ink-dim hover:bg-surface hover:text-ink'
              }`}
            >
              {meta && <span aria-hidden className="text-[0.65rem]" style={{ color: meta.color }}>{meta.glyph}</span>}
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Tag rows */}
      {tags.length ? (
        <ul className="overflow-hidden rounded-lg border border-line">
          {tags.map((t, i) => (
            <li
              key={t.id}
              className={`flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface ${
                i > 0 ? 'border-t border-line' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] leading-snug text-ink">{t.comment}</p>
                <p className="mono mt-1 truncate text-[0.75rem] text-ink-mute">
                  {pathOf(t.page_url)} <span className="text-ink-dim">·</span> &lt;{t.anchor?.tagName ?? 'el'}&gt;
                </p>
              </div>
              <StatusSelect tagId={t.id} value={t.status} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <p className="text-[0.9375rem] text-ink-dim">
            {status ? `No ${status.replace('_', ' ')} tags.` : 'No tags on this project yet.'}
          </p>
          {!status && (
            <p className="mt-1 text-[0.8125rem] text-ink-mute">
              Share the project key with your client to start collecting.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
