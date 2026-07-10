import type { Tag } from './types'

export type Milestone = { name: string; status: 'waiting' | 'in_progress' | 'done' }
export type DashboardProject = {
  name: string; description: string | null; github_link: string | null
  site_url: string | null; slug: string; milestones: Milestone[]; created_at: string
}
export type Dashboard = { project: DashboardProject; tags: Tag[] }

export function progressPct(ms: Milestone[]): number {
  if (!ms.length) return 0
  return Math.round((ms.filter((m) => m.status === 'done').length / ms.length) * 100)
}
