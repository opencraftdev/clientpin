import { generateAnchor, findElement } from './anchor'
import { createTag, getTags, getTag, uploadScreenshot } from './supabase'
import { getActive } from './projects'
import { cropRect } from './crop'
import './overlay.css'

// ---- pins for the active project ----
async function loadPins() {
  const active = await getActive()
  if (!active) return
  const rows = await getTags(active.project_key, location.href)
  for (const r of rows) {
    const el = findElement(r.anchor)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const pin = document.createElement('div')
    pin.className = 'qa-pin'; pin.title = r.comment
    pin.style.top = `${rect.top + scrollY}px`; pin.style.left = `${rect.left + scrollX}px`
    document.body.appendChild(pin)
  }
}

// ---- screenshot of an element (best-effort) ----
async function screenshot(el: Element, slug: string): Promise<string | null> {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'capture' }) as { dataUrl: string | null }
    if (!resp?.dataUrl) return null
    const img = new Image(); img.src = resp.dataUrl
    await img.decode()
    const r = el.getBoundingClientRect()
    const c = cropRect({ x: r.x, y: r.y, width: r.width, height: r.height }, devicePixelRatio)
    const canvas = document.createElement('canvas'); canvas.width = c.sw; canvas.height = c.sh
    canvas.getContext('2d')!.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, c.sw, c.sh)
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) return null
    return await uploadScreenshot(slug, blob)
  } catch { return null }
}

// ---- inline bubble comment box ----
function askComment(el: Element): Promise<string | null> {
  return new Promise((resolve) => {
    const r = el.getBoundingClientRect()
    const box = document.createElement('div')
    box.className = 'qa-bubble'
    box.style.top = `${r.bottom + scrollY + 8}px`
    box.style.left = `${Math.max(8, r.left + scrollX)}px`
    box.innerHTML = `<textarea class="qa-bubble-input" placeholder="What needs fixing?"></textarea>
      <div class="qa-bubble-row"><button class="qa-bubble-cancel">Cancel</button><button class="qa-bubble-send">Send</button></div>`
    document.body.appendChild(box)
    const ta = box.querySelector('textarea') as HTMLTextAreaElement
    ta.focus()
    const done = (val: string | null) => { box.remove(); resolve(val) }
    box.querySelector('.qa-bubble-cancel')!.addEventListener('click', () => done(null))
    box.querySelector('.qa-bubble-send')!.addEventListener('click', () => done(ta.value.trim() || null))
  })
}

// ---- tag mode ----
let tagging = false
let dim: HTMLDivElement | null = null, hl: HTMLDivElement | null = null, label: HTMLDivElement | null = null
const isOurs = (el: Element | null) => !!el?.closest('.qa-toolbar, .qa-dim, .qa-highlight, .qa-pin, .qa-bubble')
const describe = (el: Element) => `${el.tagName.toLowerCase()}${(el as HTMLElement).id ? `#${(el as HTMLElement).id}` : ''}${el.classList[0] ? `.${el.classList[0]}` : ''}`

function place(el: Element) {
  if (!hl || !label) return
  const r = el.getBoundingClientRect()
  Object.assign(hl.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
  label.textContent = describe(el)
}
function onMove(e: MouseEvent) { const el = e.target as Element; if (isOurs(el)) { if (hl) hl.style.display = 'none'; return } place(el) }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') exitTagMode() }

async function onPick(e: MouseEvent) {
  const el = e.target as Element
  if (isOurs(el)) return
  e.preventDefault(); e.stopPropagation()
  // pause the highlight interactions while the bubble is open
  document.removeEventListener('mousemove', onMove, true)
  if (hl) hl.style.display = 'none'
  const comment = await askComment(el)
  if (!comment) { exitTagMode(); return }
  const active = await getActive()
  if (!active) { alert('Pick a project in the extension first.'); exitTagMode(); return }
  if (dim) dim.style.display = 'none'
  toolbar.style.display = 'none'
  const pins = [...document.querySelectorAll<HTMLElement>('.qa-pin')]
  pins.forEach((p) => (p.style.display = 'none'))
  const path = await screenshot(el, active.slug)
  if (dim) dim.style.display = ''
  toolbar.style.display = ''
  pins.forEach((p) => (p.style.display = ''))
  try {
    await createTag(active.project_key, generateAnchor(el), comment, location.href, path)
    location.reload()
  } catch (err) {
    alert('Opencraft QA Tagger: failed to save tag — ' + (err as Error).message)
    exitTagMode()
  }
}

function enterTagMode() {
  if (tagging) return; tagging = true
  dim = document.createElement('div'); dim.className = 'qa-dim'
  hl = document.createElement('div'); hl.className = 'qa-highlight'
  label = document.createElement('div'); label.className = 'qa-hl-label'; hl.appendChild(label)
  document.body.append(dim, hl)
  document.documentElement.classList.add('qa-tagging')
  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('click', onPick, true)
  document.addEventListener('keydown', onKey, true)
  btn.classList.add('qa-active'); btn.textContent = 'Cancel (Esc)'
}
function exitTagMode() {
  if (!tagging) return; tagging = false
  document.removeEventListener('mousemove', onMove, true)
  document.removeEventListener('click', onPick, true)
  document.removeEventListener('keydown', onKey, true)
  dim?.remove(); hl?.remove(); dim = hl = label = null
  document.documentElement.classList.remove('qa-tagging')
  btn.classList.remove('qa-active'); btn.textContent = 'Tag mode'
}

// ---- locate on load (#qa-locate=<tagId>) ----
async function locate() {
  const m = location.hash.match(/qa-locate=([0-9a-f-]+)/i)
  if (!m) return
  const tag = await getTag(m[1])
  if (!tag) return
  const el = findElement(tag.anchor)
  if (!el) return
  el.scrollIntoView({ block: 'center', behavior: 'instant' } as ScrollIntoViewOptions)
  const box = document.createElement('div'); box.className = 'qa-highlight'
  document.body.appendChild(box)
  const r = el.getBoundingClientRect()
  Object.assign(box.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
  setTimeout(() => box.remove(), 2500)
}

// ---- toolbar ----
const toolbar = document.createElement('div'); toolbar.className = 'qa-toolbar'
const btn = document.createElement('button'); btn.className = 'qa-toolbar-btn'; btn.textContent = 'Tag mode'
btn.onclick = () => (tagging ? exitTagMode() : enterTagMode())
toolbar.appendChild(btn); document.body.appendChild(toolbar)
loadPins()
locate()
