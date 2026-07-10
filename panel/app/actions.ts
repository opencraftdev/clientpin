'use server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { sb } from '@/lib/supabase'
import { isValidStatus } from '@/lib/types'
import { createClient as createServer } from '@/lib/supabase/server'
import type { Milestone } from '@/lib/dashboard'

export async function setStatus(slug: string, tagId: string, status: string) {
  if (!isValidStatus(status)) throw new Error('bad status')
  const supabase = await createServer()
  const { error } = await supabase.rpc('set_status', { p_tag_id: tagId, p_status: status })
  if (error) throw new Error(error.message)
  revalidatePath(`/${slug}`)
}

export async function setMilestoneStatus(slug: string, index: number, status: Milestone['status']) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')
  const { data: proj } = await supabase.from('projects').select('name,description,github_link,site_url,milestones').eq('slug', slug).eq('owner', user.id).single()
  if (!proj) throw new Error('not owner')
  const ms = (proj.milestones as Milestone[]).map((m, i) => i === index ? { ...m, status } : m)
  const { error } = await supabase.rpc('update_project', {
    p_slug: slug, p_name: proj.name, p_description: proj.description,
    p_github_link: proj.github_link, p_site_url: proj.site_url, p_milestones: ms,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/${slug}`)
}

export async function verifyPassword(slug: string, password: string): Promise<boolean> {
  const { data, error } = await sb.rpc('verify_view_password', { p_slug: slug, p_password: password })
  if (error || !data) return false
  ;(await cookies()).set(`pv-${slug}`, data as string, { httpOnly: true, sameSite: 'lax', path: `/${slug}` })
  revalidatePath(`/${slug}`)
  return true
}
