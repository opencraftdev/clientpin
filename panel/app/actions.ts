'use server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { sb } from '@/lib/supabase'
import { isValidStatus } from '@/lib/types'

export async function setStatus(slug: string, tagId: string, status: string) {
  if (!isValidStatus(status)) throw new Error('bad status')
  const { error } = await sb.rpc('set_status', { p_tag_id: tagId, p_status: status })
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
