# LANDING-DESIGN.md — ClientPin marketing site

Register: **brand** (the design IS the product here). Goal: make a visitor understand ClientPin in 20 seconds and want to install it. Optimize for the **download**.

Separate from `DESIGN.md` (the product/admin Material spec), which stays as-is.

## Direction

**"Confident product landing, light with depth."** Named references: Linear's structural clarity + Raycast's friendly polish, carrying **ClientPin blue** as the identity and letting the **status triad** (amber / blue / green) bring color where the lifecycle is explained. Not a flat minimalist page (the previous version was too plain), not a dark developer console, not SaaS-cream. Rich, sectioned, and specific: real product components on the page, not abstract blurbs.

The memorable motif is the **pin**: a teardrop marker that recurs (logo, hero mockup, flow-diagram nodes, section bullets).

## Theme

**Light with atmosphere.** Near-white canvas so it feels open and trustworthy (people install what they trust), but with depth: a soft blue radial glow behind the hero, subtle section tints, real shadows on floating product components. Not flat, not moody.

## Color — OKLCH

Strategy: **Committed** accent (ClientPin blue carries the hero and CTAs) + a deliberate **status triad** used only in the lifecycle/flow content. Never `#000`/`#fff`.

```css
--bg:        oklch(0.985 0.003 255);   /* page canvas, near-white cool     */
--surface:   oklch(1.00 0 0);          /* floating cards (use sparingly)   */
--surface-2: oklch(0.968 0.005 255);   /* tinted section / hover           */
--line:      oklch(0.908 0.006 255);
--ink:       oklch(0.24 0.02 265);     /* headlines, near-black cool       */
--ink-dim:   oklch(0.46 0.02 265);     /* body                             */
--ink-mute:  oklch(0.60 0.015 265);    /* meta                             */

--accent:      oklch(0.55 0.19 256);   /* ClientPin blue                   */
--accent-2:    oklch(0.62 0.20 262);   /* lighter blue for gradients/glow  */
--accent-ink:  oklch(0.99 0.01 256);

/* Status triad (lifecycle + flow only) */
--new:      oklch(0.70 0.16 70);       /* amber   */
--progress: oklch(0.58 0.17 256);      /* blue    */
--resolved: oklch(0.62 0.15 150);      /* green   */
```

Atmosphere: a hero background radial `radial-gradient(60rem 40rem at 50% -20%, oklch(0.62 0.20 262 / 0.12), transparent 70%)`. Soft, wide, low-alpha. No gradient text, no glassmorphism.

## Typography

Three roles, all `next/font/google`, none from the reflex-reject list:
- **Display** → **Bricolage Grotesque** (characterful modern grotesk): hero headline + section headings. Big, tight tracking, weight 700–800. This is the personality.
- **Body / UI** → **Hanken Grotesk**: subheads, paragraphs, buttons, labels.
- **Mono** → **JetBrains Mono**: URLs, selectors, the AI-fix prompt block, code-ish chips.

Scale is fluid `clamp()` with strong contrast: hero `clamp(3rem, 8vw, 6rem)`, section H2 `clamp(2rem, 4vw, 3rem)`. Body 1.0625rem, line-height ~1.6. Fallback if Bricolage is unavailable at build: Hanken Grotesk weight 800 for display.

## Sections (top to bottom)

1. **Sticky slim nav** — pin logo + "ClientPin", inline anchors (How it works, Features, Install), and a persistent **Install** button (blue). Slight background/shadow on scroll.
2. **Hero** — left: eyebrow chip, oversized display headline, one-sentence value prop, dual CTA (**Download the extension** primary + **See how it works** secondary), a trust line (free · no account · works in Chrome/Edge/Brave). Right: the **browser+pin mockup** (component highlighted, pin, client comment bubble), floating on the blue glow. Staggered entrance.
3. **Value strip** — three short outcome statements with pin bullets (e.g. "No more 'the button near the footer'", "Every report has a screenshot", "One link, no logins"). Not icon cards, a tight typographic row.
4. **How it works — the detailed flow diagram (the centerpiece).** A real horizontal graph (vertical on mobile) of labeled nodes connected by arrows, each node a small styled component with a mini illustration:
   `Click an element` → `ClientPin captures a screenshot + its exact location` → `Saved to your project (Supabase)` → `Share one link` → `Team views, jumps to it, sets status, copies an AI-fix prompt` → `Auto-deletes after 7 days`.
   Under the diagram, 3 expanded step explanations with detail (what the anchor is, what the screenshot captures, how locate works). Color the status node with the triad.
5. **Features** — 4 to 6 alternating/rich blocks, each showing a REAL component, not a generic card:
   - **Pinpoint screenshots**: a mock screenshot card cropped to a button.
   - **Jump to the live element**: mock "Locate" interaction (pin scrolling into a page).
   - **Status lifecycle**: the three status chips New → In progress → Resolved.
   - **AI-fix prompts**: a real `JetBrains Mono` prompt block with a "Copy" affordance.
   - **Share by link, no accounts**: a slug URL chip.
   - **Private by default, 7-day expiry**: a small countdown/expiry visual.
6. **Install — the conversion section** (visually prominent, tinted band). Big heading, a note that it is not on the Chrome Web Store yet so install the build directly, a large **Download ClientPin (.zip)** button, and a clear numbered **load-unpacked** guide (download+unzip → chrome://extensions → Developer mode → Load unpacked → pin it → create a project). "Keep the folder" caveat. Reassure: takes a minute, Chromium browsers.
7. **FAQ** — 4 to 6 Q&As: Is it free? Do I need an account? Is my data safe / what is stored? Why not the Web Store yet? What happens after 7 days? Which browsers?
8. **Final CTA** — one more download button on a blue band.
9. **Footer** — logo, anchors, expiry note, made-by line.

## Components to build

Reusable, in the page or a `_landing/` folder: `Pin`, `NavBar` (client, scroll state), `BrowserMockup`, `FlowDiagram` (SVG connectors + nodes), `FeatureBlock`, `StatusChip`, `PromptBlock` (mono + copy), `InstallSteps`, `Faq` (native `<details>` for accessible expand), `CtaButton`.

## Motion

One orchestrated hero entrance (staggered rise). Section content fades/rises in on scroll (IntersectionObserver, subtle, once). Flow-diagram arrows may draw in when scrolled into view. Buttons: 150ms ease-out. Respect `prefers-reduced-motion`. Never animate layout properties.

## Bans (in force)

No gradient text, no glassmorphism, no side-stripe borders, no hero-metric template, no identical icon-card grid (features must show real components), no em dashes in copy, no centered-stack template (compositions are left-aligned or asymmetric).

## Scope note

Fonts and styles are scoped to the landing route only; the Material app pages keep Roboto and their tokens. Download button points at `/clientpin.zip` (host the build in `panel/public/`).
