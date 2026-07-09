export type Status = 'new' | 'in_progress' | 'resolved'
export type Anchor = { selector: string; text: string | null; nthOfType: number | null }
export type Tag = {
  id: string; project_id: string; page_url: string
  anchor: Anchor; comment: string; status: Status; created_at: string
}

const STATUSES: Status[] = ['new', 'in_progress', 'resolved']
export const nextStatuses = (): Status[] => [...STATUSES]
export const isValidStatus = (s: string): s is Status =>
  (STATUSES as string[]).includes(s)
