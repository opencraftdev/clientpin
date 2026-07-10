import { generateAnchor, findElement, type Anchor } from './anchor'
import { sb, getKey } from './supabase'
import './overlay.css'

type Row = { id: string; anchor: Anchor; comment: string }

async function loadPins() {
  const key = await getKey()
  if (!key) return
  const { data, error } = await sb.rpc('get_tags', {
    p_project_key: key, p_page_url: location.href,
  })
  if (error) {
    console.error('[QA] failed to load tags:', error.message)
    return
  }
  const rows = (data ?? []) as Row[]
  const unfound: Row[] = []
  for (const r of rows) {
    const el = findElement(r.anchor)
    if (!el) { unfound.push(r); continue }
    const rect = el.getBoundingClientRect()
    const pin = document.createElement('div')
    pin.className = 'qa-pin'
    pin.title = r.comment
    pin.style.top = `${rect.top + window.scrollY}px`
    pin.style.left = `${rect.left + window.scrollX}px`
    document.body.appendChild(pin)
  }
  if (unfound.length) console.info('[QA] unanchored tags:', unfound)
}

// ── Tag mode: dim the page, highlight the hovered element, click to tag ──
let tagging = false
let dim: HTMLDivElement | null = null
let hl: HTMLDivElement | null = null
let label: HTMLDivElement | null = null

// Ignore our own overlay UI when picking a target.
const isOurs = (el: Element | null) =>
  !!el?.closest('.qa-toolbar, .qa-dim, .qa-highlight, .qa-pin')

function describe(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : ''
  const cls = el.classList[0] ? `.${el.classList[0]}` : ''
  return `${tag}${id}${cls}`
}

function place(el: Element) {
  if (!hl || !label) return
  const r = el.getBoundingClientRect()
  hl.style.display = 'block'
  hl.style.top = `${r.top}px`
  hl.style.left = `${r.left}px`
  hl.style.width = `${r.width}px`
  hl.style.height = `${r.height}px`
  label.textContent = describe(el)
}

function onMove(e: MouseEvent) {
  const el = e.target as Element
  if (isOurs(el)) { if (hl) hl.style.display = 'none'; return }
  place(el)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') exitTagMode()
}

async function onPick(e: MouseEvent) {
  const el = e.target as Element
  if (isOurs(el)) return
  e.preventDefault(); e.stopPropagation()
  const comment = prompt('Comment for this element:')  // ponytail: native prompt, replace with inline box if UX demands
  if (comment) {
    const key = await getKey()
    const { error } = await sb.rpc('create_tag', {
      p_project_key: key, p_anchor: generateAnchor(el),
      p_comment: comment, p_page_url: location.href,
    })
    if (error) {
      alert('QA Tagger: failed to save tag — ' + error.message)
      exitTagMode()
    } else {
      location.reload()
    }
    return
  }
  exitTagMode()
}

function enterTagMode() {
  if (tagging) return
  tagging = true

  dim = document.createElement('div')
  dim.className = 'qa-dim'

  hl = document.createElement('div')
  hl.className = 'qa-highlight'
  label = document.createElement('div')
  label.className = 'qa-hl-label'
  hl.appendChild(label)

  document.body.append(dim, hl)
  document.documentElement.classList.add('qa-tagging')

  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('click', onPick, true)
  document.addEventListener('keydown', onKey, true)

  btn.classList.add('qa-active')
  btn.textContent = 'Cancel (Esc)'
}

function exitTagMode() {
  if (!tagging) return
  tagging = false

  document.removeEventListener('mousemove', onMove, true)
  document.removeEventListener('click', onPick, true)
  document.removeEventListener('keydown', onKey, true)

  dim?.remove(); hl?.remove()
  dim = hl = label = null
  document.documentElement.classList.remove('qa-tagging')

  btn.classList.remove('qa-active')
  btn.textContent = 'Tag mode'
}

const toolbar = document.createElement('div')
toolbar.className = 'qa-toolbar'
const btn = document.createElement('button')
btn.className = 'qa-toolbar-btn'
btn.textContent = 'Tag mode'
btn.onclick = () => (tagging ? exitTagMode() : enterTagMode())
toolbar.appendChild(btn)
document.body.appendChild(toolbar)
loadPins()
