import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const sb = createClient(url, anon)

export function screenshotUrl(path: string): string {
  return `${url}/storage/v1/object/public/screenshots/${path}`
}
