'use server'
import { createClient } from '@/lib/supabase/server'

export type Milestone = { name: string; status: 'waiting' | 'in_progress' | 'done' }

export async function createProject(input: {
  name: string; description: string; github_link: string; site_url: string
  milestones: Milestone[]; view_password: string
}): Promise<{ slug: string; project_key: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_project', {
    p_name: input.name, p_description: input.description,
    p_github_link: input.github_link || null, p_site_url: input.site_url || null,
    p_milestones: input.milestones, p_view_password: input.view_password,
  })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('Project creation returned no data')
  return row as { slug: string; project_key: string }
}
