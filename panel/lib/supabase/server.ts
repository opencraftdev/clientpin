import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const store = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          // setAll is a no-op in Server Components (cookies() is read-only there);
          // the middleware/proxy refreshes the session, so swallowing this is safe.
          // Required by @supabase/ssr — without it a token refresh during an RSC
          // render throws and tears down the stream (EPIPE), wedging the dev server.
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options))
          } catch {
            // called from a Server Component render — ignore
          }
        },
      },
    }
  )
}
