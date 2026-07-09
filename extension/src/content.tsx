import { generateAnchor, findElement, type Anchor } from './anchor'
import { sb, getKey } from './supabase'
import './overlay.css'

type Row = { id: string; anchor: Anchor; comment: string }

let armed = false

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

function enableTagMode() {
  if (armed) return; armed = true
  const onClick = async (e: MouseEvent) => {
    if ((e.target as Element).classList?.contains('qa-toolbar-btn')) return
    e.preventDefault(); e.stopPropagation()
    const el = e.target as Element
    const comment = prompt('Comment for this element:')  // ponytail: native prompt, replace with inline box if UX demands
    if (comment) {
      const key = await getKey()
      const { error } = await sb.rpc('create_tag', {
        p_project_key: key, p_anchor: generateAnchor(el),
        p_comment: comment, p_page_url: location.href,
      })
      if (error) {
        alert('QA Tagger: failed to save tag — ' + error.message)
      } else {
        location.reload()
      }
    }
    document.removeEventListener('click', onClick, true)
    armed = false
  }
  document.addEventListener('click', onClick, true)
}

const toolbar = document.createElement('div')
toolbar.className = 'qa-toolbar'
const btn = document.createElement('button')
btn.className = 'qa-toolbar-btn'
btn.textContent = 'Tag mode'
btn.onclick = enableTagMode
toolbar.appendChild(btn)
document.body.appendChild(toolbar)
loadPins()
