import { createClient } from '@supabase/supabase-js'
import type { Anchor } from './anchor'

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export async function createProject(name: string, siteUrl: string) {
  const { data, error } = await sb.rpc('create_project', { p_name: name, p_site_url: siteUrl })
  if (error) throw new Error(error.message)
  return (Array.isArray(data) ? data[0] : data) as { slug: string; project_key: string }
}

export async function createTag(
  key: string, anchor: Anchor, comment: string, pageUrl: string, screenshotPath: string | null,
) {
  const { error } = await sb.rpc('create_tag', {
    p_project_key: key, p_anchor: anchor, p_comment: comment,
    p_page_url: pageUrl, p_screenshot_path: screenshotPath,
  })
  if (error) throw new Error(error.message)
}

export async function getTags(key: string, pageUrl: string) {
  const { data } = await sb.rpc('get_tags', { p_project_key: key, p_page_url: pageUrl })
  return (data ?? []) as { id: string; anchor: Anchor; comment: string }[]
}

export async function getTag(id: string) {
  const { data } = await sb.rpc('get_tag', { p_tag_id: id })
  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as { anchor: Anchor; page_url: string } | null
}

export async function uploadScreenshot(slug: string, blob: Blob): Promise<string> {
  const path = `${slug}/${crypto.randomUUID()}.png`
  const { error } = await sb.storage.from('screenshots').upload(path, blob, { contentType: 'image/png' })
  if (error) throw new Error(error.message)
  return path
}
