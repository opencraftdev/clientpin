export const GITHUB_REPO = 'opencraftdev/qa-admin-panel'
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`

export function formatStars(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

// Cached hourly so the landing does not hit GitHub on every request.
// Returns null on any failure so the badge degrades to icon-only.
export async function githubStars(repo = GITHUB_REPO): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null
  } catch {
    return null
  }
}
