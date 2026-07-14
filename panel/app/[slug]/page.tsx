import { cookies } from 'next/headers'
import { sb, screenshotUrl } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'
import { progressPct, type Dashboard } from '@/lib/dashboard'
import { buildPrompt, buildBulkPrompt } from '@/lib/prompt'
import type { Tag } from '@/lib/types'
import { STATUS_META } from '@/lib/types'
import { PasswordGate } from './PasswordGate'
import { Logo, Avatar } from '../_landing/parts'
import { profileOf, type Profile } from '@/lib/user'
import { InstallSteps, DownloadButton } from '../_landing/InstallSteps'
import { Sidebar } from './Sidebar'
import { Milestones } from './Milestones'
import { StatusSelect } from './StatusSelect'
import { CopyButton } from './CopyButton'

function pathOf(u: string): string { try { return new URL(u).pathname } catch { return u } }

async function loadDashboard(slug: string): Promise<{ dash: Dashboard; isOwner: boolean; me: Profile | null } | null> {
  // Owner path: authenticated read gives the view_token, then reuse get_dashboard.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: owned } = await supabase.from('projects').select('view_token').eq('slug', slug).eq('owner', user.id).maybeSingle()
    if (owned?.view_token) {
      const { data } = await sb.rpc('get_dashboard', { p_slug: slug, p_token: owned.view_token })
      if (data) return { dash: data as Dashboard, isOwner: true, me: profileOf(user) }
    }
  }
  // Viewer path: token cookie.
  const token = (await cookies()).get(`pv-${slug}`)?.value
  if (token) {
    const { data } = await sb.rpc('get_dashboard', { p_slug: slug, p_token: token })
    if (data) return { dash: data as Dashboard, isOwner: false, me: null }
  }
  return null
}

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await loadDashboard(slug)
  // No token/session that unlocks this slug -> show the password gate. An unknown
  // slug also lands here (its password can never match), which avoids leaking whether
  // a project exists. notFound() is intentionally not used here.
  if (!result) return <PasswordGate slug={slug} />

  const { dash, isOwner, me } = result
  const { project, tags } = dash
  const pct = progressPct(project.milestones)
  return (
    <div className="grid-paper min-h-screen">
      {/* Slim brand bar */}
      <header className="border-b border-line bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Logo size={22} />
          <div className="flex items-center gap-3">
            {isOwner ? (
              <>
                <a href="/projects" className="ring-accent text-[0.8125rem] font-medium text-ink-dim transition-colors hover:text-ink">Projects</a>
                <a href="/onboarding" className="ring-accent border border-line bg-surface px-3 py-1.5 text-[0.8125rem] font-semibold text-ink transition-colors hover:bg-surface-2">+ New project</a>
                {me && (
                  <span className="inline-flex items-center gap-2 border border-line bg-surface py-1 pl-1 pr-3">
                    <Avatar src={me.avatarUrl} name={me.name} size={24} />
                    <span className="max-w-[10rem] truncate text-[0.8125rem] font-medium text-ink">{me.name}</span>
                  </span>
                )}
              </>
            ) : (
              <span className="font-code inline-flex items-center gap-2 border border-line bg-surface px-3 py-1 text-[0.65rem] uppercase tracking-wide text-ink-mute">
                <span className="h-1.5 w-1.5 bg-resolved" /> Client view
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <Sidebar active="basic" />
          <div className="min-w-0 flex-1">
            {/* Basic info */}
            <section id="basic" className="reg-marks rounded-2xl border border-line bg-surface p-7 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-code inline-block border border-accent bg-accent-soft px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-accent">ClientPin project</span>
                  <h1 className="font-display mt-3 text-[2rem] font-bold leading-none tracking-[-0.02em] text-ink">{project.name}</h1>
                  {project.description && <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-dim">{project.description}</p>}
                  <p className="font-code mt-3 text-[0.72rem] text-ink-mute">Created {new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-code text-[0.65rem] uppercase tracking-wide text-ink-mute">Progress</div>
                  <div className="font-display text-[2.75rem] font-extrabold leading-none text-accent">{pct}<span className="text-[1.5rem]">%</span></div>
                </div>
              </div>
              <div className="mt-7"><Milestones milestones={project.milestones} isOwner={isOwner} slug={slug} /></div>
              {(project.site_url || project.github_link) && (
                <div className="mt-7 border-t border-line pt-5">
                  <h2 className="font-code text-[0.7rem] font-semibold uppercase tracking-wide text-ink-dim">Build &amp; Test</h2>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {project.site_url && <a href={project.site_url} target="_blank" rel="noreferrer" className="rounded-xl bg-accent px-4 py-2 text-[0.8125rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press">Web service ↗</a>}
                    {project.github_link && <a href={project.github_link} target="_blank" rel="noreferrer" className="rounded-xl border border-line px-4 py-2 text-[0.8125rem] font-semibold text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink">GitHub ↗</a>}
                  </div>
                </div>
              )}
            </section>

            {/* QA */}
            <section id="qa" className="mt-6 rounded-2xl border border-line bg-surface p-7 shadow-card">
              <div className="flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-[1.125rem] font-bold text-ink">
                  QA pins <span className="font-code grid h-6 min-w-6 place-items-center border border-line px-1.5 text-[0.72rem] font-semibold text-ink-dim">{tags.length}</span>
                </h2>
                {tags.length > 0 && <CopyButton text={buildBulkPrompt(tags as Tag[])} label="Copy AI Fix (all)" className="ring-accent bg-accent px-4 py-2 text-[0.8125rem] font-semibold text-accent-ink transition-colors hover:bg-accent-press" />}
              </div>
              {tags.length ? (
                <ul className="mt-5 flex flex-col divide-y divide-line">
                  {(tags as Tag[]).map((t) => (
                    <li key={t.id} className="flex gap-4 py-4 first:pt-0">
                      <a href={`${t.page_url}#qa-locate=${t.id}`} target="_blank" rel="noreferrer" className="relative block h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-bg transition-shadow hover:shadow-bar">
                        {t.screenshot_path ? <img src={screenshotUrl(t.screenshot_path)} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-[0.65rem] text-ink-mute">no shot</span>}
                        <span aria-hidden className="absolute -right-1.5 -top-2" style={{ color: STATUS_META[t.status].color }}>
                          <svg width="14" height="18" viewBox="0 0 24 32" aria-hidden><path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="currentColor" /><circle cx="12" cy="12" r="4.4" fill="var(--color-surface)" /></svg>
                        </span>
                      </a>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.9375rem] leading-snug text-ink">{t.comment}</p>
                        <p className="font-code mt-1 truncate text-[0.72rem] text-ink-mute">{pathOf(t.page_url)} · &lt;{t.anchor.tagName}&gt;{t.anchor.nthOfType ? ` · ×${t.anchor.nthOfType}` : ''}</p>
                        <div className="mt-2.5 flex items-center gap-3">
                          {isOwner
                            ? <StatusSelect slug={slug} tagId={t.id} value={t.status} />
                            : <span style={{ background: STATUS_META[t.status].soft, color: STATUS_META[t.status].color, borderColor: STATUS_META[t.status].color }} className="font-code inline-flex items-center gap-1.5 border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide"><span className="h-1.5 w-1.5" style={{ background: STATUS_META[t.status].color }} />{STATUS_META[t.status].label}</span>
                          }
                          <CopyButton text={buildPrompt(t)} className="ring-accent rounded-lg px-2.5 py-1 text-[0.8125rem] font-semibold text-accent transition-colors hover:bg-accent-soft" />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 border border-dashed border-line-2 px-6 py-10">
                  <div className="text-center">
                    <span className="mx-auto text-pin" style={{ display: 'inline-block' }}>
                      <svg width="26" height="34" viewBox="0 0 24 32" aria-hidden><path d="M12 0C5.4 0 0 5.4 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.4 18.6 0 12 0z" fill="currentColor" /><circle cx="12" cy="12" r="4.4" fill="var(--color-surface)" /></svg>
                    </span>
                    <p className="mt-3 text-[0.9375rem] font-semibold text-ink">No QA pins yet</p>
                    <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] leading-relaxed text-ink-dim">Haven&apos;t installed the extension yet? It takes about a minute, works in any Chromium browser (Chrome, Edge, Brave, Arc), and is not on the Web Store yet, so you install it directly.</p>
                    <div className="mt-5 flex justify-center"><DownloadButton /></div>
                  </div>
                  <div className="mx-auto mt-8 max-w-md">
                    <p className="font-code mb-3 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-mute">Then, in your browser</p>
                    <InstallSteps />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
