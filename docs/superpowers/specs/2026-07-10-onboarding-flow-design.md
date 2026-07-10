# ClientPin Onboarding + Project Dashboard — Design / Spec

**Date:** 2026-07-10
**Status:** Approved for planning
**Builds on:** `2026-07-10-opencraftqa-design.md` (the public-list pivot). This adds owner accounts, an onboarding wizard, and a richer client dashboard.

## 1. Summary

A CEO-directed flow change:

- **Owners** press **"Try now"** on the landing, sign in with **Google**, go through **onboarding** to create their first project (name, description, milestones, GitHub link, view-password), and get a **public link + connect code** to share.
- **Viewers/clients** open the link, enter the **password once**, and see a **project dashboard** (project header, overall progress %, milestone trackers, and a **QA** section of tagged components). Blue ClientPin styling, laid out like the reference screenshot.
- The **extension** becomes a **detector only**: the client pastes the **connect code** and tags components on their site. No project creation in the extension anymore.

## 2. Goals & non-goals

**Goals (v1, "core first")**
- Google sign-in for owners (Supabase Auth).
- Onboarding wizard → create project → success screen with copy-able public link + connect code.
- Public `/[slug]` dashboard, password-gated for viewers, with: project header, description, owner-as-PM, created date, **overall progress %**, **milestone trackers** (waiting → in progress → done), **Build & Test** link, and a **QA** section (the tagged components, reusing existing tagging).
- Owner (when signed in) can edit milestone statuses and project fields on the same dashboard; viewers see it read-only.
- Extension simplified to a connect-code detector.

**Non-goals (v1)** — stub or defer:
- The other sidebar tabs: **Dev status board**, **Confirm (컴펌)**, **Docs (자료/문서)** render as "coming soon" stubs.
- Multiple members / team roles (owner is the only PM for now).
- Email/password auth (Google only).
- Notifications, activity feed, file uploads.
- The 7-day auto-expiry is **removed** (owned projects persist).

## 3. Architecture

Three access contexts:
- **Owner (authenticated):** Google via Supabase Auth. Uses `@supabase/ssr` (reintroduced) for session cookies. RLS: an owner reads/writes only their own projects. Owner routes (`/onboarding`, and edit controls) require a session.
- **Viewer (public + password):** anonymous. `/[slug]` gates on a per-project password; on success a signed httpOnly cookie holds a **view token**, and the dashboard reads via a `SECURITY DEFINER` RPC that checks the token. Tables stay private.
- **Extension (anonymous detector):** pastes the **connect code** (= `project_key`); tags via the existing `create_tag` / `get_tags` / `get_tag` RPCs.

## 4. Data model

```
projects
  id                 uuid pk default gen_random_uuid()
  slug               text unique not null      -- public dashboard id
  project_key        text unique not null      -- connect code for the extension
  owner              uuid not null references auth.users(id) on delete cascade
  name               text not null
  description        text
  github_link        text
  site_url           text
  milestones         jsonb not null default '[]'::jsonb   -- [{ "name": text, "status": "waiting|in_progress|done" }]
  view_password_hash text not null             -- bcrypt (pgcrypto)
  view_token         text not null             -- random; handed to a verified viewer's cookie
  created_at         timestamptz not null default now()
  updated_at         timestamptz not null default now()

tags   (unchanged)
  id, project_id → projects, page_url, anchor jsonb, comment, status
    ('new'|'in_progress'|'resolved'), screenshot_path, created_at
```

Changes vs the previous model: `projects` **adds** `owner`, `description`, `github_link`, `site_url`, `milestones`, `view_password_hash`, `view_token`; **drops** `last_active_at` and the `purge_expired` cron. `tags` is unchanged (it is the **QA** section).

**Overall progress %** (computed): `round(count(done milestones) / count(total milestones) * 100)`, `0` when there are no milestones. Computed in the app from `milestones`.

## 5. Auth (owners)

- **Supabase Auth Google provider.** Set up an OAuth client in Google Cloud and enable the Google provider in Supabase (owner-configured; documented in the plan).
- Web app reintroduces `@supabase/ssr` server + browser clients (removed during the pivot) for the authenticated area.
- `/login` renders a "Continue with Google" button (`signInWithOAuth({ provider: 'google' })`), with an auth callback route to exchange the code and set the session.
- Middleware (`proxy.ts`) protects `/onboarding` (redirect to `/login` if no session). `/[slug]` and `/` stay public.

## 6. RLS & RPCs

**RLS**
- `projects`: `for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid())`. No direct access for `anon`.
- `tags`: accessible via RPCs only (as today).

**RPCs**
- `create_project(p_name, p_description, p_github_link, p_site_url, p_milestones jsonb, p_view_password text) returns table(slug text, project_key text)` — SECURITY DEFINER; sets `owner = auth.uid()`, generates `slug` + `project_key` + `view_token`, stores `crypt(p_view_password, gen_salt('bf'))`. Granted to **authenticated**.
- `update_project(p_slug, p_name, p_description, p_github_link, p_site_url, p_milestones jsonb) returns void` — owner-only (checks `owner = auth.uid()`), bumps `updated_at`. Granted to authenticated.
- `verify_view_password(p_slug, p_password) returns text` — returns `view_token` if `crypt(p_password, view_password_hash) = view_password_hash`, else null. Granted to **anon**.
- `get_dashboard(p_slug, p_token) returns jsonb` — returns `{ project, milestones, tags[] }` if `p_token = view_token`, else null. Granted to anon. (Owner path reads via RLS instead, see §8.)
- `connect_project(p_project_key) returns table(name text, slug text)` — extension confirms the code and learns the project name/slug. Granted to anon.
- **Unchanged (extension detector):** `create_tag(project_key, anchor, comment, page_url, screenshot_path)`, `get_tags(project_key, page_url)`, `get_tag(tag_id)`, `set_status(tag_id, status)`.
- `create_project`/`get_list` from the previous pivot are **replaced** by the above (`get_list` is superseded by `get_dashboard`; the old anon `create_project` is dropped).

`crypt`/`gen_salt` are pgcrypto in the `extensions` schema, so password-hashing RPCs use `set search_path = public, extensions` (same footgun handled before).

## 7. Password view-gate (app layer)

- `/[slug]/page.tsx` (server): if the visitor is the **owner** (authenticated + owns the slug) → render the dashboard with edit controls (no password). Otherwise check the httpOnly cookie `pv-<slug>`; if it holds a valid token → render read-only dashboard via `get_dashboard(slug, token)`; if absent → render `<PasswordGate>`.
- `<PasswordGate>` posts to a server action → `verify_view_password(slug, password)` → on success set httpOnly cookie `pv-<slug>` = `view_token` and `revalidatePath` → dashboard shows. On failure, show an inline error.

## 8. Owner onboarding & dashboard editing

**Onboarding** (`/onboarding`, authenticated): a form with **name**, **description**, **milestones** (add/remove simple rows, each name + status defaulting to "waiting"), **GitHub link** (optional), **site URL** (optional), and **view-password**. Submit → `create_project` → **success screen** showing the **public link** (`${APP_URL}/${slug}`) and **connect code** (`project_key`), each copy-able.

**Editing:** on `/[slug]`, when the signed-in user owns the project, the dashboard shows edit affordances, update a milestone's status (waiting/in-progress/done) and edit project fields, via `update_project`. Viewers never see these.

## 9. Client dashboard (core v1)

Layout mirrors the reference screenshot, in ClientPin blue.

- **Left sidebar:** `Basic info` (active) and `QA` are live; `Dev board`, `Confirm`, `Docs` are visible but render "Coming soon" stubs.
- **Basic info:** project name (+ a small "CLIENTPIN PROJECT" kicker), description, owner shown as **PM**, created date, **overall progress %** (top-right), and the **milestone trackers**, each milestone a 3-step **waiting → in progress → done** bar with the current step highlighted. A **Build & Test** block links the `site_url` / `github_link` if present.
- **QA:** the tagged components list, reusing the existing tag UI (screenshot thumb, comment, `page · <element>`, status control, AI-fix copy, locate). This is fed by the extension.
- **Install prompt:** the dashboard shows an "Install the ClientPin extension" callout (with the Drive download link) so the client can start tagging, and the **connect code**.

**Landing change:** the primary CTA becomes **"Try now"** → `/login`. The extension "Download" moves to the client dashboard's install callout (the landing can keep a secondary download link).

## 10. Extension (detector-only)

- Popup: remove the project dropdown / create form. It becomes: **paste connect code** → `connect_project(code)` confirms and stores `{ name, slug, project_key }` in `chrome.storage`; shows "Connected to <name>". Tagging (content script: highlight, bubble, screenshot, pins, locate) is **unchanged**.
- Manifest, background capture worker, anchor/crop modules: unchanged.

## 11. Error handling

- Wrong view-password → inline "Incorrect password", no data leaked.
- Unknown/deleted slug → `notFound()`.
- Google auth failure/cancel → back to `/login` with a message.
- `create_project` while unauthenticated → blocked by middleware; the RPC also rejects (no `auth.uid()`).
- Bad connect code in the extension → "Project not found", no crash.
- Milestone jsonb malformed → the RPCs validate the `status` values; the dashboard tolerates an empty list (progress 0%).

## 12. Testing

- **DB:** `create_project` sets owner from the JWT and returns slug+key; `verify_view_password` returns the token on match and null on mismatch; `get_dashboard` returns data only for the right token; RLS blocks a non-owner from updating; `connect_project` resolves name+slug; wrong password/token paths return null.
- **Web:** password-gate (prompt → verify → cookie → dashboard); onboarding creates a project and shows the link; owner vs viewer rendering on `/[slug]`; progress-% helper (pure) unit-tested.
- **Extension:** `connect_project` stores the project; existing anchor + crop tests still pass; tagging unchanged.

## 13. Build order

1. **DB** — schema changes (owner, description, github, site, milestones, view_password_hash, view_token; drop expiry/cron); owner RLS; new RPCs (`create_project` authed, `update_project`, `verify_view_password`, `get_dashboard`, `connect_project`); keep the extension RPCs.
2. **Web auth + onboarding** — reintroduce `@supabase/ssr`; Google `/login` + callback; protected `/onboarding` wizard; `create_project`; success screen (link + connect code); landing CTA → "Try now".
3. **Web dashboard** — `/[slug]` with owner-vs-viewer, password gate, Basic info (header, progress, milestones, Build & Test), QA section (reuse existing tag UI), sidebar stubs, install callout.
4. **Extension** — simplify popup to the connect-code detector.

Each phase is independently testable before the next.
