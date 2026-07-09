'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isValidStatus } from '@/lib/tags'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')
  const { error } = await supabase.from('projects').insert({
    name: String(formData.get('name')),
    site_url: String(formData.get('site_url')),
    owner: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/')
}

export async function setStatus(tagId: string, status: string) {
  if (!isValidStatus(status)) throw new Error('bad status')
  const supabase = await createClient()
  const { error } = await supabase.from('tags').update({ status }).eq('id', tagId)
  if (error) throw new Error(error.message)
  revalidatePath('/projects', 'layout')
}
