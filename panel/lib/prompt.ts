import type { Tag } from './types'

export function buildPrompt(t: Tag): string {
  return `Fix this UI issue on ${t.page_url}:

Problem: "${t.comment}"
Element: <${t.anchor.tagName}>  (selector: ${t.anchor.selector})
Status: ${t.status}

Apply a minimal, accessible fix consistent with the existing design system.`
}

export function buildBulkPrompt(tags: Tag[]): string {
  const open = tags.filter((t) => t.status !== 'resolved')
  const items = open.map((t, i) =>
    `${i + 1}. On ${t.page_url} — "${t.comment}" (element <${t.anchor.tagName}>, selector ${t.anchor.selector})`
  ).join('\n')
  return `Fix the following ${open.length} UI issues. Apply minimal, accessible fixes consistent with the existing design system.\n\n${items}`
}
