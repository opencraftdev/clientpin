'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
