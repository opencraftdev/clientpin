import { expect, test } from 'vitest'
import { isValidStatus, nextStatuses } from './tags'

test('valid statuses', () => {
  expect(nextStatuses()).toEqual(['new', 'in_progress', 'resolved'])
  expect(isValidStatus('resolved')).toBe(true)
  expect(isValidStatus('done')).toBe(false)
})
