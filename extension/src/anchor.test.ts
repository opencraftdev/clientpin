// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { generateAnchor, findElement } from './anchor'

test('round-trips via selector', () => {
  document.body.innerHTML = `<main><section></section>
    <section><button class="cta">Add to cart</button></section></main>`
  const btn = document.querySelector('button')!
  const a = generateAnchor(btn)
  expect(findElement(a)).toBe(btn)
})

test('falls back to text when selector breaks', () => {
  document.body.innerHTML = `<div><button class="cta">Buy</button></div>`
  const a = generateAnchor(document.querySelector('button')!)
  // simulate rebuild: same text, different structure/classes
  document.body.innerHTML = `<section><button class="new">Buy</button></section>`
  expect(findElement(a)?.textContent).toBe('Buy')
})
