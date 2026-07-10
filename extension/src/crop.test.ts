import { expect, test } from 'vitest'
import { cropRect } from './crop'

test('scales rect by devicePixelRatio and rounds', () => {
  expect(cropRect({ x: 10.4, y: 20.6, width: 100.2, height: 50.7 }, 2)).toEqual({ sx: 21, sy: 41, sw: 200, sh: 101 })
  expect(cropRect({ x: 0, y: 0, width: 50, height: 50 }, 1)).toEqual({ sx: 0, sy: 0, sw: 50, sh: 50 })
})
