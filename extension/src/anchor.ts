export type Anchor = { selector: string; text: string | null; nthOfType: number | null }

function cssPath(el: Element): string {
  const parts: string[] = []
  let node: Element | null = el
  while (node && node.nodeType === 1 && node !== document.body) {
    let part = node.tagName.toLowerCase()
    const parent = node.parentElement
    if (parent) {
      const sameTag = [...parent.children].filter(c => c.tagName === node!.tagName)
      if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`
    }
    parts.unshift(part)
    node = node.parentElement
  }
  return parts.join(' > ')
}

export function generateAnchor(el: Element): Anchor {
  const parent = el.parentElement
  const nth = parent
    ? [...parent.children].filter(c => c.tagName === el.tagName).indexOf(el) + 1
    : null
  return {
    selector: cssPath(el),
    text: el.textContent?.trim() || null,
    nthOfType: nth,
  }
}

export function findElement(a: Anchor, root: ParentNode = document): Element | null {
  const bySelector = safeQuery(root, a.selector)
  if (bySelector) return bySelector
  if (a.text) {
    const match = [...root.querySelectorAll('*')].find(
      e => e.children.length === 0 && e.textContent?.trim() === a.text
    )
    if (match) return match
  }
  return null
}

function safeQuery(root: ParentNode, selector: string): Element | null {
  try { return root.querySelector(selector) } catch { return null }
}
