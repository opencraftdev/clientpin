# DESIGN.md — QA Admin Panel

Register: **product** (design serves the task). The tool should disappear into triage.

## Context

A QA lead scans dense lists of client-reported UI bugs across several client sites and moves each through a status lifecycle, in long focused sessions on a large screen. The data is technical: project keys, page URLs, DOM selectors, element tags. The interface treats that technical data as first-class, not as afterthought strings.

**Direction: console-native.** Warm charcoal dark surface, a single acid-lime signal accent for interaction, and a monospace layer for every machine value. Dense rows over cards. It should feel built for engineers reading element anchors, not a generic SaaS dashboard.

Anti-references: dashboard-navy admin templates, SaaS-cream light UIs, gradient hero-metric cards, glassmorphism.

## Theme

Dark. The scene forces it: long technical sessions, values-dense screens, eyes on the same surface for hours. Warm (not blue) charcoal so it reads as "console/paper-under-lamp," not "midnight SaaS."

## Color — OKLCH

Never `#000`/`#fff`. Neutrals tinted warm (hue ~70). Strategy: **Restrained** — tinted neutrals + one accent, plus a semantic status triad.

```css
:root {
  /* Warm charcoal neutrals (hue 70, low chroma) */
  --bg:        oklch(0.17 0.008 70);   /* app background            */
  --surface:   oklch(0.21 0.008 70);   /* panels, rows, toolbars    */
  --surface-2: oklch(0.25 0.009 70);   /* hover row, raised control */
  --border:    oklch(0.31 0.010 70);   /* hairlines, dividers       */
  --border-2:  oklch(0.40 0.012 70);   /* focus-adjacent, stronger  */
  --text:      oklch(0.93 0.006 75);   /* primary text              */
  --text-dim:  oklch(0.71 0.010 75);   /* secondary / labels        */
  --text-mute: oklch(0.55 0.012 75);   /* meta, disabled hint       */

  /* Interactive accent — acid lime. Actions, focus, current selection ONLY. */
  --accent:      oklch(0.86 0.19 128);
  --accent-press:oklch(0.80 0.18 128);
  --accent-ink:  oklch(0.20 0.02 128);  /* text ON accent            */

  /* Status triad — semantic, deliberately distinct from --accent */
  --new:         oklch(0.82 0.16 65);   /* amber  — needs attention  */
  --progress:    oklch(0.74 0.12 235);  /* azure  — being worked     */
  --resolved:    oklch(0.66 0.045 150); /* dim green — done, muted    */

  /* Feedback */
  --danger:      oklch(0.64 0.19 25);
  --focus-ring:  oklch(0.86 0.19 128 / 0.55);
}
```

Rules:
- `--accent` is for interaction only (primary buttons, focus rings, current selection, `+ new`). Never decoration.
- Status color appears as a **dot/glyph + colored label**, never as a full-row fill or a left side-stripe.
- `resolved` is intentionally low-chroma: done work recedes.

## Typography

Two families, loaded via `next/font`:
- **Sans (UI):** Inter → `--font-sans`. Labels, headings, body, buttons.
- **Mono (machine values):** JetBrains Mono → `--font-mono`. Project keys, URLs, DOM selectors, element tags, IDs, timestamps.

The mono layer is the signature: any value the system generated or the browser produced renders in mono, tinted `--text-dim`. Any value a human wrote (comment, project name) renders in sans, `--text`.

Scale (fixed rem, ratio ~1.2, dense base):
```
--fs-meta: 0.75rem   /* 12px — URLs, selectors, meta   */
--fs-body: 0.8125rem /* 13px — table body, labels       */
--fs-ui:   0.875rem  /* 14px — inputs, buttons, default  */
--fs-h2:   1.0625rem /* 17px — section headers           */
--fs-h1:   1.375rem  /* 22px — page title                */
```
Weights: 400 body, 500 labels/buttons, 600 headings. Numeric/mono uses `font-variant-numeric: tabular-nums`.

## Layout

- **No cards for lists.** Full-width rows separated by `--border` hairlines. Cards were the preview's rejected default.
- **App shell:** slim top bar (`--surface`, app mark left, project context + sign-out right), then content max-width ~72rem, generous left/right gutter.
- **Project detail:** sticky sub-header (project name + key + filter chips), then the tag rows below.
- Spacing on a 4px grid; vary rhythm (tight within a row, roomy between sections). Row vertical padding ~10–12px for density without cramping.
- Responsive is structural: below ~640px the two-line row stacks and the top bar condenses. No fluid type.

## Components (each ships default / hover / focus / active / disabled / loading / empty)

- **Primary button:** `--accent` fill, `--accent-ink` text, weight 500. Hover lifts lightness slightly; active → `--accent-press`; focus → 2px `--focus-ring` offset ring.
- **Ghost button / links:** transparent, `--text-dim`; hover → `--text` + `--surface-2` wash.
- **Input:** `--surface` field, 1px `--border`, `--text`. Focus → `--border` becomes `--accent`, plus focus ring. Mono inputs (keys) use `--font-mono`.
- **Status indicator:** a filled dot (`new` amber, `progress` azure, `resolved` dim-green) + label in the same hue, `--fs-body`, weight 500. Glyph option: `●` new, `◐` in-progress, `✓` resolved.
- **Status select:** styled native `<select>` on `--surface-2`, current value shows its status dot. Change animates the dot color 150ms.
- **Project key chip:** mono, truncated (`4cccbb90…`) with a `[copy]` affordance; click copies full key, flashes accent for 1 pulse.
- **Filter chips:** `All / ● new / ◐ in-progress / ✓ resolved`; selected chip gets `--surface-2` + its status color, others `--text-dim`.
- **Tag row (two lines):** line 1 = status + comment (sans); line 2 = `page_url · <selector>` in mono `--text-dim`. Hover → `--surface-2`.
- **Empty states teach:** projects empty → "No projects yet. Create one to get a project key for the extension." tags empty → "No tags on this project yet. Share the project key with your client to start collecting."
- **Loading:** skeleton rows (shimmering `--surface`→`--surface-2`), never centered spinners.

## Motion

- 150–200ms, `ease-out` (quart/expo). Applies to hover washes, focus rings, status-dot color, copy-pulse.
- Never animate layout properties. No page-load choreography. Motion only conveys state.

## Bans (in force here)

No side-stripe borders, no gradient text, no glassmorphism, no hero-metric cards, no identical card grids, no modals for the create-project or comment flows (inline/progressive instead). No em dashes in UI copy.
