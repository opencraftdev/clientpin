// Normalize a Supabase auth user (Google OAuth) into a display profile.
export type Profile = { name: string; avatarUrl: string | null; email: string | null }
type AuthUser = { email?: string | null; user_metadata?: Record<string, unknown> } | null

export function profileOf(user: AuthUser): Profile | null {
  if (!user) return null
  const m = (user.user_metadata ?? {}) as Record<string, string | undefined>
  return {
    name: m.full_name || m.name || m.user_name || user.email || 'Account',
    avatarUrl: m.avatar_url || m.picture || null,
    email: user.email ?? null,
  }
}
