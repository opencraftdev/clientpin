import { notFound } from 'next/navigation'
import { sb, screenshotUrl } from '@/lib/supabase'
import { buildPrompt, buildBulkPrompt } from '@/lib/prompt'
import type { Tag } from '@/lib/types'
import { StatusSelect } from './StatusSelect'
import { CopyButton } from './CopyButton'

function daysLeft(lastActive: string): number {
  const ms = new Date(lastActive).getTime() + 7 * 864e5 - Date.now()
  return Math.max(0, Math.ceil(ms / 864e5))
}

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await sb.rpc('get_list', { p_slug: slug })
  if (!data) notFound()
  const project = data.project as { name: string; site_url: string; last_active_at: string }
  const tags = (data.tags ?? []) as Tag[]

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem] font-medium tracking-tight text-ink">{project.name}</h1>
          <a href={project.site_url} target="_blank" rel="noreferrer" className="mono text-[0.8125rem] text-accent hover:underline">{project.site_url}</a>
          <p className="mt-1 text-[0.75rem] text-ink-mute">Expires in {daysLeft(project.last_active_at)} days</p>
        </div>
        {tags.length > 0 && (
          <CopyButton
            text={buildBulkPrompt(tags)} label="Copy AI Fix for all"
            className="ring-accent shadow-bar rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-accent-ink hover:bg-accent-press"
          />
        )}
      </div>

      {tags.length ? (
        <ul className="flex flex-col gap-3">
          {tags.map((t) => (
            <li key={t.id} className="shadow-card flex gap-4 rounded-xl border border-line bg-surface p-4">
              <a href={`${t.page_url}#qa-locate=${t.id}`} target="_blank" rel="noreferrer"
                 className="ring-accent block h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-bg" title="Open and locate on the live page">
                {t.screenshot_path
                  ? <img src={screenshotUrl(t.screenshot_path)} alt="" className="h-full w-full object-cover" />
                  : <span className="grid h-full w-full place-items-center text-[0.6875rem] text-ink-mute">no shot</span>}
              </a>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] text-ink">{t.comment}</p>
                <p className="mono mt-1 truncate text-[0.75rem] text-ink-mute">
                  {new URL(t.page_url).pathname} · &lt;{t.anchor.tagName}&gt;
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <StatusSelect slug={slug} tagId={t.id} value={t.status} />
                  <CopyButton text={buildPrompt(t)} className="ring-accent rounded-md px-2 py-1 text-[0.8125rem] font-medium text-accent hover:bg-accent-soft" />
                  <a href={`${t.page_url}#qa-locate=${t.id}`} target="_blank" rel="noreferrer" className="text-[0.8125rem] text-ink-dim hover:text-accent">Locate</a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="shadow-card rounded-xl border border-line bg-surface px-6 py-14 text-center">
          <p className="text-[0.9375rem] font-medium text-ink">No tags yet</p>
          <p className="mt-1 text-[0.8125rem] text-ink-dim">Tag components with the extension to fill this list.</p>
        </div>
      )}
    </main>
  )
}
