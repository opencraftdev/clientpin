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

test('text fallback does not match a different tag', () => {
  document.body.innerHTML = `<div><button>Buy</button></div>`
  const a = generateAnchor(document.querySelector('button')!)
  // rebuild DOM with same text but wrong tag (span, not button)
  document.body.innerHTML = `<section><span>Buy</span></section>`
  expect(findElement(a)).toBeNull()
})

test('malformed selector falls back safely to text+tag match', () => {
  document.body.innerHTML = `<div><button>Buy</button></div>`
  const btn = document.querySelector('button')!
  const a = { selector: '>>>bad', text: 'Buy', tagName: 'button', nthOfType: 1 }
  expect(findElement(a)).toBe(btn)
})
