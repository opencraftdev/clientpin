import { cookies } from 'next/headers'
import { sb, screenshotUrl } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'
import { progressPct, type Dashboard } from '@/lib/dashboard'
import { buildPrompt, buildBulkPrompt } from '@/lib/prompt'
import type { Tag } from '@/lib/types'
import { PasswordGate } from './PasswordGate'
import { Sidebar } from './Sidebar'
import { Milestones } from './Milestones'
import { StatusSelect } from './StatusSelect'
import { CopyButton } from './CopyButton'

function pathOf(u: string): string { try { return new URL(u).pathname } catch { return u } }

async function loadDashboard(slug: string): Promise<Dashboard | null> {
  // Owner path: authenticated read gives the view_token, then reuse get_dashboard.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: owned } = await supabase.from('projects').select('view_token').eq('slug', slug).eq('owner', user.id).maybeSingle()
    if (owned?.view_token) {
      const { data } = await sb.rpc('get_dashboard', { p_slug: slug, p_token: owned.view_token })
      if (data) return data as Dashboard
    }
  }
  // Viewer path: token cookie.
  const token = (await cookies()).get(`pv-${slug}`)?.value
  if (token) {
    const { data } = await sb.rpc('get_dashboard', { p_slug: slug, p_token: token })
    if (data) return data as Dashboard
  }
  return null
}

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dash = await loadDashboard(slug)
  // No token/session that unlocks this slug -> show the password gate. An unknown
  // slug also lands here (its password can never match), which avoids leaking whether
  // a project exists. notFound() is intentionally not used here.
  if (!dash) return <PasswordGate slug={slug} />

  const { project, tags } = dash
  const pct = progressPct(project.milestones)
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <Sidebar active="basic" />
        <div className="min-w-0 flex-1">
          {/* Basic info */}
          <section id="basic" className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.6875rem] font-semibold text-accent">CLIENTPIN PROJECT</span>
                <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-ink">{project.name}</h1>
                {project.description && <p className="mt-2 max-w-xl text-[0.9375rem] text-ink-dim">{project.description}</p>}
                <p className="mono mt-3 text-[0.75rem] text-ink-mute">Created {new Date(project.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right"><div className="text-[0.6875rem] text-ink-mute">Progress</div><div className="text-[2rem] font-bold text-accent">{pct}%</div></div>
            </div>
            <div className="mt-6"><Milestones milestones={project.milestones} /></div>
            {(project.site_url || project.github_link) && (
              <div className="mt-6">
                <h2 className="text-[0.9375rem] font-semibold text-ink">Build &amp; Test</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.site_url && <a href={project.site_url} target="_blank" rel="noreferrer" className="rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-accent-ink">Web service ↗</a>}
                  {project.github_link && <a href={project.github_link} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-4 py-2 text-[0.8125rem] font-medium text-ink-dim">GitHub ↗</a>}
                </div>
              </div>
            )}
          </section>

          {/* QA */}
          <section id="qa" className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-[1.125rem] font-semibold text-ink">QA · {tags.length}</h2>
              {tags.length > 0 && <CopyButton text={buildBulkPrompt(tags as Tag[])} label="Copy AI Fix (open)" className="ring-accent rounded-full bg-accent px-4 py-1.5 text-[0.8125rem] font-medium text-accent-ink" />}
            </div>
            {tags.length ? (
              <ul className="mt-4 flex flex-col gap-3">
                {(tags as Tag[]).map((t) => (
                  <li key={t.id} className="flex gap-4 rounded-xl border border-line p-3">
                    <a href={`${t.page_url}#qa-locate=${t.id}`} target="_blank" rel="noreferrer" className="block h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
                      {t.screenshot_path ? <img src={screenshotUrl(t.screenshot_path)} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-[0.65rem] text-ink-mute">no shot</span>}
                    </a>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] text-ink">{t.comment}</p>
                      <p className="mono mt-1 truncate text-[0.75rem] text-ink-mute">{pathOf(t.page_url)} · &lt;{t.anchor.tagName}&gt;</p>
                      <div className="mt-2 flex items-center gap-3">
                        <StatusSelect slug={slug} tagId={t.id} value={t.status} />
                        <CopyButton text={buildPrompt(t)} className="ring-accent rounded-md px-2 py-1 text-[0.8125rem] font-medium text-accent hover:bg-accent-soft" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center">
                <p className="text-[0.9375rem] font-medium text-ink">No QA tags yet</p>
                <p className="mt-1 text-[0.8125rem] text-ink-dim">Install the ClientPin extension, paste the connect code, and tag components on your site.</p>
                <a href="https://drive.google.com/uc?export=download&id=1BdGhCMq_RWir4spB-5xST8w8hs-ptkpi" target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-[0.8125rem] font-medium text-accent-ink">Install the extension</a>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
