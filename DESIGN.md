# DESIGN.md — QA Admin Panel

Register: **product** (design serves the task). Familiar, calm, easy to scan. The tool should disappear into triage.

## Context

A QA lead manages client-reported UI bugs across several client sites and moves each through a status lifecycle. The data is technical (project keys, page URLs, DOM selectors), but the operators are not all engineers, so the interface prioritizes **ease of use and legibility** over density.

**Direction: Material / Google-Admin-console.** A bright, airy light theme with a **persistent left sidebar** for navigation, a clean top app bar, content in soft cards, Google-blue primary actions, and Material-style status chips. Familiar on purpose: anyone who has used Google Admin, GCP, or Google Workspace should feel immediately at home.

Anti-references: dark "developer console" UIs, dense terminal aesthetics, decorative gradients, glassmorphism.

## Theme

**Light.** The scene forces it: an approachable admin tool used in normal office light by mixed-skill operators who want clarity, not a moody engineering surface. Bright neutral canvas, white cards, generous whitespace.

## Color — OKLCH (light, Material-derived)

Never `#000`/`#fff`. Neutrals tinted slightly cool (hue ~260). Strategy: **Restrained** — near-white surfaces, grey text hierarchy, one Google-blue accent, plus a semantic status triad rendered as soft chips.

```css
--color-bg:        oklch(0.975 0.003 260);  /* app canvas — light grey     */
--color-surface:   oklch(0.995 0.001 260);  /* cards, sidebar, top bar      */
--color-surface-2: oklch(0.965 0.004 260);  /* hover, selected nav          */
--color-line:      oklch(0.912 0.004 260);  /* dividers, card borders (#dadce0) */
--color-line-2:    oklch(0.86 0.005 260);   /* stronger border              */

--color-ink:       oklch(0.30 0.012 265);   /* primary text (#202124)       */
--color-ink-dim:   oklch(0.52 0.014 265);   /* secondary (#5f6368)          */
--color-ink-mute:  oklch(0.63 0.012 265);   /* meta, placeholder            */

/* Google blue accent — primary actions, active nav, focus */
--color-accent:       oklch(0.55 0.17 256);
--color-accent-press: oklch(0.48 0.16 256);
--color-accent-ink:   oklch(0.99 0.005 256); /* text on accent (white)      */
--color-accent-soft:  oklch(0.95 0.03 256);  /* selected-nav tint           */

/* Status triad + soft chip backgrounds */
--color-new:       oklch(0.55 0.13 60);      /* amber-brown text            */
--color-new-soft:  oklch(0.95 0.05 75);      /* amber chip bg               */
--color-progress:  oklch(0.50 0.15 256);     /* blue text                   */
--color-progress-soft: oklch(0.94 0.04 256); /* blue chip bg                */
--color-resolved:  oklch(0.48 0.12 150);     /* green text                  */
--color-resolved-soft: oklch(0.93 0.05 150); /* green chip bg               */

--color-danger:    oklch(0.55 0.20 27);

/* Material elevation (soft, low-spread) */
--shadow-card: 0 1px 2px oklch(0.30 0.01 265 / 0.10), 0 1px 3px oklch(0.30 0.01 265 / 0.06);
--shadow-bar:  0 1px 2px oklch(0.30 0.01 265 / 0.08);
```

Rules:
- Accent = interaction only (primary buttons, active nav item, focus ring, links). Never decoration.
- Status shows as a **soft pill**: tinted background + colored text + small dot. Never a full-row fill or side-stripe.

## Typography

Loaded via `next/font/google`:
- **Roboto** → UI (labels, headings, body, buttons). The Material default.
- **Roboto Mono** → machine values only (project keys, URLs, DOM selectors, tags, IDs), tinted `--color-ink-dim`.

Scale (fixed rem, ratio ~1.2). Weights: 400 body, 500 labels/buttons/nav, 500–700 headings.
```
--fs-meta: 0.75rem   --fs-body: 0.8125rem   --fs-ui: 0.875rem
--fs-h2:   1.125rem  --fs-h1:  1.5rem
```

## Layout — the Google-Admin shell

- **Persistent left sidebar (~248px):** product mark at top ("QA Admin"), primary nav, then the live list of the user's **Projects** as nav items (one-click switching), and a prominent **＋ New project**. Active item gets `--color-accent-soft` bg + accent text with a rounded-full pill shape (Material nav style).
- **Top app bar:** thin, `--shadow-bar`, holds the current page title / breadcrumb on the left and the account + **Sign out** on the right.
- **Content:** roomy padding (24–32px), cards on `--color-bg`, max readable width. Data as clean tables/lists inside a single card, not nested cards.
- Responsive: sidebar collapses to an off-canvas / top strip under ~768px; tables scroll horizontally. No fluid type.

## Components (default / hover / focus / active / disabled / loading / empty)

- **Primary button:** `--color-accent` fill, white text, `--shadow-bar`, radius 8px. Hover darkens; focus ring accent.
- **Text/ghost button:** accent text, transparent; hover → `--color-accent-soft`.
- **Nav item:** rounded-full, `--color-ink-dim`; hover → `--color-surface-2`; active → `--color-accent-soft` + accent text + 500 weight, with a leading icon.
- **Input:** white field, 1px `--color-line`, radius 8px; focus → 2px accent border (Material outlined field).
- **Status chip / select:** soft pill (`*-soft` bg, colored text, leading dot). The status control is a pill-shaped select showing the current status; changing it recolors instantly (optimistic).
- **Key chip:** mono, truncated, click-to-copy with a check confirmation.
- **Card:** white, `--shadow-card`, radius 12px, `--color-line` hairline. One card per logical group.
- **Empty states teach**, never "nothing here."
- **Loading:** skeleton rows, not spinners.

## Motion

150–200ms `ease-out`. Nav hover/active, chip recolor, copy confirm, button press. Never animate layout. No page-load choreography.

## Bans (in force)

No side-stripe borders, no gradient text, no glassmorphism, no hero-metric cards, no nested cards, no modals for create/comment (inline), no em dashes in UI copy.
