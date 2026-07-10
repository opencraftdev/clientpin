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
export const STATUS_META: Record<Status, { label: string; color: string; soft: string }> = {
  new:         { label: 'New',         color: 'var(--color-new)',      soft: 'var(--color-new-soft)' },
  in_progress: { label: 'In progress', color: 'var(--color-progress)', soft: 'var(--color-progress-soft)' },
  resolved:    { label: 'Resolved',    color: 'var(--color-resolved)', soft: 'var(--color-resolved-soft)' },
}
