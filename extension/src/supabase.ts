import { createClient } from '@supabase/supabase-js'

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const getKey = async (): Promise<string | null> => {
  const result = await chrome.storage.local.get('projectKey')
  return (result.projectKey as string) ?? null
}
export const setKey = async (k: string): Promise<void> =>
  chrome.storage.local.set({ projectKey: k })
