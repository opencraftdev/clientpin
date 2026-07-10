'use server'
import { revalidatePath } from 'next/cache'
import { sb } from '@/lib/supabase'
import { isValidStatus } from '@/lib/types'

export async function setStatus(slug: string, tagId: string, status: string) {
  if (!isValidStatus(status)) throw new Error('bad status')
  const { error } = await sb.rpc('set_status', { p_tag_id: tagId, p_status: status })
  if (error) throw new Error(error.message)
  revalidatePath(`/${slug}`)
}
