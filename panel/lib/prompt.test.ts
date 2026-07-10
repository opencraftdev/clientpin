import { expect, test } from 'vitest'
import { buildPrompt, buildBulkPrompt } from './prompt'
import type { Tag } from './types'

const tag = (over: Partial<Tag> = {}): Tag => ({
  id: '1', page_url: 'https://acme.store/checkout',
  anchor: { selector: 'button.cta', text: null, nthOfType: null, tagName: 'button' },
  comment: 'button text overlaps on mobile', status: 'new',
  screenshot_path: null, created_at: '', ...over,
})

test('buildPrompt includes url, comment, element, status', () => {
  const p = buildPrompt(tag())
  expect(p).toContain('Fix this UI issue on https://acme.store/checkout:')
  expect(p).toContain('Problem: "button text overlaps on mobile"')
  expect(p).toContain('Element: <button>  (selector: button.cta)')
  expect(p).toContain('Status: new')
  expect(p).toContain('Apply a minimal, accessible fix consistent with the existing design system.')
})

test('buildBulkPrompt lists only open items', () => {
  const p = buildBulkPrompt([tag({ id: 'a' }), tag({ id: 'b', status: 'resolved' })])
  expect(p).toContain('Fix the following 1 UI issues')
  expect((p.match(/acme.store/g) ?? []).length).toBe(1)
})
