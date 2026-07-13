# DESIGN.md — ClientPin

One design system across two registers:

- **App** (`/login`, `/onboarding`, `/[slug]` dashboard, gates) → **product** register. The interface serves the task: create a project, triage pins, move statuses. Clarity over decoration.
- **Landing** (`/`) → **brand** register. The page is the product's pitch. Same tokens, turned up.

## The idea: a precision drafting instrument

ClientPin pins a bug to an **exact element on an exact page**. The whole product is about precise location, coordinates, and a physical marker dropped on a surface. So the interface is a **drafting table / survey instrument**, not another grey admin console.

Concretely that means: a warm, airy near-white canvas, ink-dark structural type, hairline rules and a faint blueprint grid, coordinate-style mono labels, corner registration marks on key surfaces, and one signature motif, the **pin**, rendered as a real map-marker. The pin's own **coral/vermilion is promoted to the primary brand color**: it carries the brand, the actions, the active step, the progress. Cobalt drops back to a single job, the "in progress" working state. One warm accent doing all the work on generous whitespace, calm but confident, the way a premium onboarding feels.

This is deliberately **not** the two reflex answers for a QA/bug tool: not the dark developer console, and not Google-Admin Material blue-on-grey (which is what the previous version was). It is also specific enough, drafting and survey, that it does not collapse into generic "editorial grotesque."

Anti-references: Google Admin / GCP, Material chip sheets, dark Linear-style dashboards, purple SaaS gradients, glassmorphism, terminal green-on-black.

## Register: **product** primary, **brand** on the landing

Same tokens, type, and motifs everywhere. The landing may go **Committed** with color (drench the final CTA, oversize the display type, lean into the grid texture); the app stays **Restrained**: paper canvas, ink hierarchy, cobalt for interaction only, vermilion reserved for the pin and the "New" state.

## Theme

**Light, warm paper.** Scene: a QA lead and a non-engineer client reviewing bug pins together in normal office light, wanting to read comments and see screenshots clearly. That forces light. But warm, not the cool clinical grey of the old Material build: a faint ivory canvas that reads like drafting paper, so the tool has a point of view instead of defaulting to "safe white."

## Color — OKLCH

Never `#000`/`#fff`. Neutrals tinted faintly **warm** (hue ~80), brighter and airier than the old ivory; ink tinted **indigo** (hue ~275) so text reads as deep blue-black, a quiet complementary tension against the warm coral. Strategy: **Restrained** everywhere, one warm coral accent on lots of whitespace. The landing may go **Committed** (drench the final CTA).

```css
/* Warm near-white neutrals */
--color-bg:        oklch(0.987 0.004 80);   /* airy canvas                 */
--color-surface:   oklch(0.998 0.001 80);   /* cards, bars                 */
--color-surface-2: oklch(0.970 0.006 78);   /* inset, hover, selected      */
--color-line:      oklch(0.912 0.006 78);   /* hairline rules, borders     */
--color-line-2:    oklch(0.855 0.008 76);   /* stronger rule / tick        */

/* Indigo-tinted ink */
--color-ink:       oklch(0.26 0.028 275);   /* primary text — blue-black   */
--color-ink-dim:   oklch(0.47 0.028 272);   /* secondary                   */
--color-ink-mute:  oklch(0.63 0.022 272);   /* meta, placeholder, ticks    */

/* Coral/vermilion — THE primary. Brand, actions, active step, progress, focus. */
--color-accent:       oklch(0.635 0.190 34);
--color-accent-press: oklch(0.565 0.180 34);
--color-accent-ink:   oklch(0.995 0.010 60);  /* text on coral (near-white)*/
--color-accent-soft:  oklch(0.950 0.038 45);  /* selected / eyebrow tint   */

/* Pin alias — the marker glyph is the accent color. */
--color-pin:       oklch(0.635 0.190 34);
--color-pin-soft:  oklch(0.950 0.038 45);

/* Status triad — semantic. New = fresh marker (coral), In progress =
   working (cobalt, its one remaining job), Resolved = done (green). */
--color-new:           oklch(0.620 0.185 34);
--color-new-soft:      oklch(0.950 0.038 42);
--color-progress:      oklch(0.520 0.170 262);
--color-progress-soft: oklch(0.940 0.045 262);
--color-resolved:      oklch(0.520 0.125 155);
--color-resolved-soft: oklch(0.935 0.048 150);

--color-danger:    oklch(0.545 0.205 25);

/* Elevation — soft, low-spread, indigo-tinted (premium, barely-there) */
--shadow-card: 0 1px 2px oklch(0.26 0.03 275 / 0.05), 0 8px 24px oklch(0.26 0.03 275 / 0.05);
--shadow-bar:  0 1px 2px oklch(0.26 0.03 275 / 0.05);
--shadow-lift: 0 2px 6px oklch(0.26 0.03 275 / 0.06), 0 18px 40px oklch(0.26 0.03 275 / 0.10);
```

Rules:
- **Coral = brand + interaction** (primary buttons, active step, progress ring, focus ring, links, the pin). Generous on whitespace but never a decorative fill on large neutral areas except the final landing CTA.
- **Cobalt = "In progress" status only.** It is no longer a structural color.
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
- **Onboarding:** a **two-pane stepper wizard** (see below), not a single long form. Full-height. Left rail = the stepper; right pane = the current step's fields with a bottom nav bar.
- **Login / gate:** single centered card on paper, generous whitespace, the pin/logo as the anchor. Not a bare form floating in space, give it a drafting card with a header.
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

## Stepper — the onboarding wizard

The CEO-requested signature component. A two-pane, full-height wizard that walks a new owner through creating their first project.

**Left rail (~300px, `--color-surface`, hairline right border):**
- Top: the **Logo** + a small **progress ring** (SVG, coral arc on `--color-line` track) reading `n/4`.
- A rail title (`font-display`, e.g. "Set up your project") + one muted subtitle line.
- The **step list**, vertical, each row: a numbered token (`01`–`04`) + label, joined by a thin connector line down the left of the tokens.
  - **Done:** filled coral token with a check, ink label, connector above filled coral.
  - **Active:** filled ink/coral token, `font-semibold` label, a soft `--color-accent-soft` rounded highlight behind the row + a trailing chevron.
  - **Upcoming:** outlined muted token (`--color-line-2`), `--color-ink-mute` label, not clickable forward past the furthest-reached step.
  - A visited step is clickable to go back; upcoming steps are not clickable.
- Bottom: the user's email (mono, muted) + a quiet "Save and exit" link (returns home).

**Right pane (fills remaining width, on `--color-bg`):**
- A small coral eyebrow: `Step n / 4`.
- Step **title** (`font-display`, ~1.75rem) + a one-to-two line description in `--color-ink-dim`.
- The step's fields, grouped in one `--color-surface` card (`--shadow-card`, radius 16px) with numbered sub-labels when a step has parts (mirrors the reference's `01 / 02` sub-sections).
- A **bottom nav bar** pinned below the content: a circular ghost **Back** button (‹, hidden on step 1) on the left; the primary CTA on the right (`Continue →`, or `Create project` on the last step), disabled until the step's required fields are valid.

**Steps (our content):** `01 Project` (name + description) · `02 Milestones` (the milestone list) · `03 Links` (GitHub + site URL, both optional) · `04 Access` (view password). Only Project name and Access password are required. On submit of step 4 → `createProject` → the **Share** screen (a centered success card with the public link + connect code, replacing the wizard).

**Behavior:** one step visible at a time; state persists across steps (no data loss navigating back); `Continue` advances and marks the step done; the ring and list update. Reduced motion: no slide, just swap.

## Motion

150-220ms, **ease-out** (`cubic-bezier(0.16,1,0.3,1)`), no bounce, never animate layout properties. Uses: pin drop on hero load, staggered `rise` entrance (fill-mode both, never leaves content hidden), scroll `reveal` (visible by default, JS only enhances), nav/chip hover, status recolor, copy pulse. Respect `prefers-reduced-motion`.

## Bans (in force)

No side-stripe borders. No gradient text (`background-clip:text`). No glassmorphism as decoration (the nav's scroll blur is the one intentional exception). No hero-metric template. No identical icon-card grids as the only idea. No modals for create/comment (inline / wizard). No em dashes in UI copy. No `#000`/`#fff`. Coral is generous but calm, earned by whitespace, never a decorative fill on a large neutral area (the final landing CTA is the one deliberate drench).

## The slop test

If someone could name the theme from the category alone ("QA tool → dark console" or "→ Google blue"), it failed. This build answers neither: warm near-white paper, indigo ink, a coral survey-pin carrying the brand, cobalt kept only for "in progress." The specificity comes from the product's real function, precise location, and a stepper that feels like a premium setup, not from a trend.
