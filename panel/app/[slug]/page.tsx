import { notFound } from 'next/navigation'
import { sb, screenshotUrl } from '@/lib/supabase'
import { buildPrompt, buildBulkPrompt } from '@/lib/prompt'
import type { Tag } from '@/lib/types'
import { StatusSelect } from './StatusSelect'
import { CopyButton } from './CopyButton'

function pathOf(u: string): string {
  try { return new URL(u).pathname } catch { return u }
}

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
    <div className="min-h-screen">
      {/* Brand bar */}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-6 py-3">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-accent text-[0.65rem] font-bold text-accent-ink">Q</span>
          <span className="text-[0.8125rem] font-medium text-ink-dim">Opencraft QA Tagger</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        {/* Title block */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-ink">{project.name}</h1>
          <a href={project.site_url} target="_blank" rel="noreferrer"
             className="mono text-[0.8125rem] text-accent hover:underline">{project.site_url}</a>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.8125rem] text-ink-dim">
            <span>{tags.length} {tags.length === 1 ? 'tag' : 'tags'}</span>
            <span className="text-ink-mute">·</span>
            <span>Expires in {daysLeft(project.last_active_at)} days</span>
            {tags.length > 0 && (
              <CopyButton
                text={buildBulkPrompt(tags)} label="Copy AI Fix"
                className="ring-accent ml-auto rounded-full bg-accent px-4 py-1.5 text-[0.8125rem] font-medium text-accent-ink transition-colors hover:bg-accent-press"
              />
            )}
          </div>
        </div>

        {/* List */}
        {tags.length ? (
          <ul className="flex flex-col gap-3">
            {tags.map((t) => (
              <li key={t.id} className="shadow-card flex gap-4 rounded-2xl border border-line bg-surface p-3.5 transition-shadow hover:shadow-bar">
                {/* Screenshot = click to locate */}
                <a href={`${t.page_url}#qa-locate=${t.id}`} target="_blank" rel="noreferrer"
                   title="Open the live page and locate this element"
                   className="ring-accent group relative block aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-xl border border-line bg-bg">
                  {t.screenshot_path
                    ? <img src={screenshotUrl(t.screenshot_path)} alt="" className="h-full w-full object-cover" />
                    : <span className="grid h-full w-full place-items-center text-[0.6875rem] text-ink-mute">no screenshot</span>}
                  <span className="absolute inset-0 grid place-items-center bg-ink/0 text-[0.75rem] font-medium text-transparent transition-colors group-hover:bg-ink/45 group-hover:text-accent-ink">
                    ↗ Locate
                  </span>
                </a>

                {/* Body */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-[0.9375rem] leading-snug text-ink">{t.comment}</p>
                  <p className="mono mt-1 truncate text-[0.75rem] text-ink-mute">
                    {pathOf(t.page_url)} · &lt;{t.anchor.tagName}&gt;
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <StatusSelect slug={slug} tagId={t.id} value={t.status} />
                    <CopyButton
                      text={buildPrompt(t)} label="AI Fix"
                      className="ring-accent rounded-full bg-accent-soft px-3 py-1 text-[0.75rem] font-medium text-accent transition-colors hover:bg-accent hover:text-accent-ink"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="shadow-card rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
            <p className="text-[0.9375rem] font-medium text-ink">No tags yet</p>
            <p className="mt-1 text-[0.8125rem] text-ink-dim">Tag components with the extension to fill this list.</p>
          </div>
        )}
      </main>
    </div>
  )
}
