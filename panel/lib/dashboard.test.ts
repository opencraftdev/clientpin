import { expect, test } from 'vitest'
import { progressPct } from './dashboard'

test('progress is done/total rounded, 0 when empty', () => {
  expect(progressPct([])).toBe(0)
  expect(progressPct([{ name: 'a', status: 'done' }, { name: 'b', status: 'waiting' }])).toBe(50)
  expect(progressPct([{ name: 'a', status: 'done' }, { name: 'b', status: 'done' }, { name: 'c', status: 'in_progress' }])).toBe(67)
})
