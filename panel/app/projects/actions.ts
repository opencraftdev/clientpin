'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Owner-scoped delete. RLS (projects_owner) already restricts to the owner;
// the .eq('owner') is belt-and-suspenders. Tags cascade via FK; screenshots
// in storage are swept by the expiry job. ponytail: no storage cleanup here.
export async function deleteProject(slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('projects').delete().eq('slug', slug).eq('owner', user.id)
  if (error) throw new Error(error.message)
  revalidatePath('/projects')
}
