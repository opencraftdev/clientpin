# DESIGN.md — ClientPin

One design system across two registers:

- **App** (`/login`, `/onboarding`, `/[slug]` dashboard, gates) → **product** register. The interface serves the task: create a project, triage pins, move statuses. Clarity over decoration.
- **Landing** (`/`) → **brand** register. The page is the product's pitch. Same tokens, turned up.

## The idea: a precision drafting instrument

ClientPin pins a bug to an **exact element on an exact page**. The whole product is about precise location, coordinates, and a physical marker dropped on a surface. So the interface is a **drafting table / survey instrument**, not another grey admin console.

Concretely that means: a warm paper canvas, ink-dark structural type, hairline rules and a faint blueprint grid, coordinate-style mono labels, corner registration marks on key surfaces, and one signature motif, the **pin**, rendered as a real map-marker in vermilion. Cobalt carries structure and action; vermilion is the marker, the attention, the "this needs a look."

This is deliberately **not** the two reflex answers for a QA/bug tool: not the dark developer console, and not Google-Admin Material blue-on-grey (which is what the previous version was). It is also specific enough, drafting and survey, that it does not collapse into generic "editorial grotesque."

Anti-references: Google Admin / GCP, Material chip sheets, dark Linear-style dashboards, purple SaaS gradients, glassmorphism, terminal green-on-black.

## Register: **product** primary, **brand** on the landing

Same tokens, type, and motifs everywhere. The landing may go **Committed** with color (drench the final CTA, oversize the display type, lean into the grid texture); the app stays **Restrained**: paper canvas, ink hierarchy, cobalt for interaction only, vermilion reserved for the pin and the "New" state.

## Theme

**Light, warm paper.** Scene: a QA lead and a non-engineer client reviewing bug pins together in normal office light, wanting to read comments and see screenshots clearly. That forces light. But warm, not the cool clinical grey of the old Material build: a faint ivory canvas that reads like drafting paper, so the tool has a point of view instead of defaulting to "safe white."

## Color — OKLCH

Never `#000`/`#fff`. Neutrals tinted **warm** (hue ~85); ink tinted **indigo** (hue ~275) so text sits as deep blue-black on warm paper, a quiet complementary tension. Strategy: **Restrained** in the app (paper + ink + one cobalt accent, vermilion as the sharp <10% marker); **Committed** allowed on the landing.

```css
/* Warm paper neutrals */
--color-bg:        oklch(0.984 0.006 85);   /* drafting-paper canvas       */
--color-surface:   oklch(0.997 0.002 85);   /* cards, bars                 */
--color-surface-2: oklch(0.966 0.008 83);   /* inset, hover, selected      */
--color-line:      oklch(0.903 0.008 83);   /* hairline rules, borders     */
--color-line-2:    oklch(0.845 0.010 80);   /* stronger rule / tick        */

/* Indigo-tinted ink */
--color-ink:       oklch(0.27 0.030 275);   /* primary text — blue-black   */
--color-ink-dim:   oklch(0.47 0.030 272);   /* secondary                   */
--color-ink-mute:  oklch(0.62 0.024 272);   /* meta, placeholder, ticks    */

/* Cobalt — structure, actions, active nav, focus, links */
--color-accent:       oklch(0.50 0.200 262);
--color-accent-press: oklch(0.43 0.190 262);
--color-accent-ink:   oklch(0.99 0.010 262);  /* text on cobalt            */
--color-accent-soft:  oklch(0.94 0.045 262);  /* selected tint             */

/* Vermilion — the pin, the marker, attention. Used sparingly, high impact. */
--color-pin:       oklch(0.605 0.200 32);
--color-pin-soft:  oklch(0.945 0.050 45);

/* Status triad — semantic. New = live marker (vermilion), In progress =
   working (cobalt), Resolved = done (drafting green). Soft = chip bg. */
--color-new:           oklch(0.575 0.190 33);
--color-new-soft:      oklch(0.945 0.050 42);
--color-progress:      oklch(0.50 0.180 262);
--color-progress-soft: oklch(0.940 0.045 262);
--color-resolved:      oklch(0.50 0.130 155);
--color-resolved-soft: oklch(0.935 0.050 150);

--color-danger:    oklch(0.53 0.210 25);

/* Elevation — warm, low-spread, indigo-tinted */
--shadow-card: 0 1px 2px oklch(0.27 0.03 275 / 0.07), 0 6px 16px oklch(0.27 0.03 275 / 0.05);
--shadow-bar:  0 1px 2px oklch(0.27 0.03 275 / 0.06);
--shadow-lift: 0 2px 4px oklch(0.27 0.03 275 / 0.08), 0 14px 32px oklch(0.27 0.03 275 / 0.10);
```

Rules:
- **Cobalt = interaction only** (primary buttons, active nav, focus ring, links). Never decoration.
- **Vermilion = the pin and "New" only.** It is the loudest thing on the page; keep it under ~10% of any view so it stays loud. Never a large fill (except the pin glyph itself).
- Status renders as a **soft pill**: tinted bg + colored text + a leading dot. Never a full-row fill, never a side-stripe.

## Typography

Unify the whole product on one distinctive set (kills the old Roboto/Bricolage split). Loaded via `next/font/google` in the root layout as CSS variables:

- **Bricolage Grotesque** → `--font-display`. Headings, the wordmark, big numbers. Warm, slightly wonky grotesque with real character.
- **Hanken Grotesk** → `--font-sans` (default body/UI). Clean, humanist, legible at small sizes. Replaces Roboto everywhere.
- **JetBrains Mono** → `--font-mono`. Machine values only: project keys, URLs, DOM selectors, coordinates, IDs, tags. Replaces Roboto Mono. Tinted `--color-ink-mute` or `--color-ink-dim`.

Hierarchy through scale + weight, ratio ~1.25. Headings 600-800 (display), labels/buttons/nav 500-600, body 400. Tighten display tracking (`-0.02em` to `-0.03em`). Cap body measure at 68ch.

```
--fs-meta 0.75  --fs-body 0.8125  --fs-ui 0.875  --fs-lead 1.0625
--fs-h2 1.125   --fs-h1 1.5       display hero uses clamp()
```

## Signature motifs (the drafting layer)

Use these to build atmosphere without gradients or glass. Sparingly, they are seasoning:

- **Blueprint grid:** a very faint fixed dot/line grid on the paper canvas (single utility, ~3% ink). Grounds the "drafting surface" idea.
- **Registration marks:** small cobalt corner crosshairs on the hero shot and the dashboard header card. The surveyor's alignment mark.
- **Coordinate labels:** mono, ink-mute, e.g. `/checkout · <button.cta> · ×3`. Already how tags read; lean in.
- **Ruler ticks:** short evenly-spaced hairlines as a divider accent on section edges.
- **The pin:** vermilion map-marker, the one hero glyph. It may "drop" (a short translateY + settle) on load in the hero.

## Layout

- **App shell:** content on paper canvas, one card per logical group (`--shadow-card`, radius 14px, `--color-line` hairline). Roomy padding (24-32px). Never nest cards. Data as clean rows/lists inside one card, divided by hairlines, not a grid of sub-cards.
- **Dashboard** (`/[slug]`): keeps the left in-page nav (Sidebar) + main column. Header card carries the project identity with registration-mark corners and a large cobalt progress figure. QA pins are a hairline-divided list, each row: screenshot thumb, comment, coordinate line, status pill, AI-fix copy.
- **Onboarding / login / gate:** single centered card on paper, generous whitespace, the pin/logo as the anchor. Not a bare form floating in space, give it a drafting card with a header.
- **Landing:** full-bleed sections separated by hairline rules and ruler ticks; hero over a faint grid with the product shot on `--shadow-lift`; final CTA may drench in cobalt.
- Responsive: dashboard sidebar collapses above the content under ~768px; lists scroll; no fluid body type.

## Components (default / hover / focus / active / disabled / loading / empty)

- **Primary button:** cobalt fill, `--color-accent-ink`, `--shadow-bar`, radius 10px, 600. Hover → `--color-accent-press`; focus → cobalt ring.
- **Secondary / ghost:** `--color-line` border on surface, ink-dim; hover → surface-2 + ink. Text buttons: cobalt, hover surface-2.
- **Nav item (dashboard):** radius 10px, ink-dim; hover → surface-2; active → `--color-accent-soft` + cobalt text + 600, leading dot/tick. "soon" tabs muted, not interactive.
- **Input / textarea / select:** surface field, 1px `--color-line`, radius 10px, comfortable padding; focus → 2px cobalt border + soft ring. Labels in `--fs-meta` 500 ink-dim above the field.
- **Status pill / select:** soft pill (`*-soft` bg, colored text, leading dot). The owner control is a pill-shaped select that recolors instantly on change (optimistic). Viewer sees a static pill.
- **Key / code chip:** mono, truncated, click-to-copy with a check confirm and a brief cobalt pulse.
- **Card:** surface, `--shadow-card`, radius 14px, hairline. Key surfaces get registration-mark corners.
- **Empty states teach** (install the extension, tag your first element), never "nothing here."
- **Loading:** skeleton rows with the shimmer utility, not spinners.

## Motion

150-220ms, **ease-out** (`cubic-bezier(0.16,1,0.3,1)`), no bounce, never animate layout properties. Uses: pin drop on hero load, staggered `rise` entrance (fill-mode both, never leaves content hidden), scroll `reveal` (visible by default, JS only enhances), nav/chip hover, status recolor, copy pulse. Respect `prefers-reduced-motion`.

## Bans (in force)

No side-stripe borders. No gradient text (`background-clip:text`). No glassmorphism as decoration (the nav's scroll blur is the one intentional exception). No hero-metric template. No identical icon-card grids as the only idea. No modals for create/comment (inline / wizard). No em dashes in UI copy. No `#000`/`#fff`. Vermilion never used as a large fill.

## The slop test

If someone could name the theme from the category alone ("QA tool → dark console" or "→ Google blue"), it failed. This build answers neither: warm drafting paper, indigo ink, cobalt structure, a vermilion survey pin. The specificity comes from the product's real function, precise location, not from a trend.
