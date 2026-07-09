export type Status = 'new' | 'in_progress' | 'resolved'
export type Anchor = { selector: string; text: string | null; nthOfType: number | null; tagName: string }
export type Tag = {
  id: string; project_id: string; page_url: string
  anchor: Anchor; comment: string; status: Status; created_at: string
}

const STATUSES: Status[] = ['new', 'in_progress', 'resolved']
export const nextStatuses = (): Status[] => [...STATUSES]
export const isValidStatus = (s: string): s is Status =>
  (STATUSES as string[]).includes(s)

// Presentational metadata shared by server rows and the client status control.
// `color` maps to a CSS token defined in globals.css.
export const STATUS_META: Record<Status, { label: string; glyph: string; color: string }> = {
  new:         { label: 'new',         glyph: '●', color: 'var(--color-new)' },
  in_progress: { label: 'in progress', glyph: '◐', color: 'var(--color-progress)' },
  resolved:    { label: 'resolved',    glyph: '✓', color: 'var(--color-resolved)' },
}
