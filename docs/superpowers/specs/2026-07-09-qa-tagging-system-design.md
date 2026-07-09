# QA Tagging System — Design / PRD

**Date:** 2026-07-09
**Status:** Approved for planning

## 1. Summary

A QA management tool in two parts:

- **Chrome Extension** — used by clients on their live website. A client toggles "tag mode", clicks an element, and leaves a comment. Existing tags appear as pins anchored to their elements.
- **Admin Panel** — a web app where the QA team logs in, sees tags per project, and moves each tag through a status lifecycle.

Backend is **Supabase** (Postgres). Clients are **anonymous** — they use a per-project key, not an account. Only admins log in.

## 2. Goals & non-goals

**Goals (v1):**
- Client can create a tag (element anchor + comment) on any page of a project's site.
- Client sees existing tags on the page as pins.
- Admin logs in, sees a project's tags, and changes each tag's status.

**Non-goals (v1), fit the schema for later:**
- Screenshots / page metadata (URL beyond page_url, viewport, console errors).
- Reply threads, assignment to admins.
- Client accounts.
- Showing tag status inside the extension.
- Rate limiting / spam protection beyond the project key.

## 3. Architecture

```
Chrome Extension (MV3)  ──RPC──►  Supabase  ◄──auth──  Admin Panel (Next.js)
   content script                 Postgres              admin-only login
   + popup (project key)          + RPC funcs           project → tag list
```

**Anonymous access via RPC, not table RLS.** Because clients have no account, the extension cannot use per-user RLS. Two `SECURITY DEFINER` Postgres functions are the entire public surface, each gated on the project key:

- `create_tag(project_key, anchor, comment, page_url)` — validates key, inserts a tag.
- `get_tags(project_key, page_url)` — returns tags for that page so the extension can draw pins.

Tables are **not** exposed to the `anon` role. The panel uses normal Supabase Auth + RLS: an admin can read/write only projects they own, and tags belonging to those projects.

## 4. Data model

```
projects
  id           uuid pk
  name         text
  site_url     text
  project_key  text unique        -- random, shared with clients
  owner        uuid               -- auth.users id
  created_at   timestamptz default now()

tags
  id           uuid pk
  project_id   uuid fk -> projects
  page_url     text
  anchor       jsonb              -- element re-location signals (see 5)
  comment      text
  status       text default 'new' -- 'new' | 'in_progress' | 'resolved'
  created_at   timestamptz default now()
```

`status` constrained by a CHECK or enum. `project_key` generated with a random function (e.g. `gen_random_uuid()` text, or a shorter nanoid).

**RLS:**
- `projects`: `owner = auth.uid()` for all operations (authenticated role).
- `tags`: readable/updatable when the parent project's `owner = auth.uid()`.
- `anon` role: no direct table access; only the two RPC functions (which run as definer).

## 5. Element anchoring (the fragile part)

`anchor` is `jsonb` rather than a bare selector string, so we can store more than one signal without a schema change:

```json
{
  "selector": "main > section:nth-of-type(2) > div.card",
  "text": "Add to cart",
  "nthOfType": 2
}
```

On page load the extension attempts to re-find the element (try `selector`, then fall back to text/structure heuristics). If nothing matches, the tag is shown in an **"unanchored" list** in the extension UI rather than drawn at a wrong position. Anchoring is inherently lossy across site rebuilds; this is mitigation, not a guarantee.

## 6. Chrome Extension

- **Stack:** Manifest V3, **React**, Vite build.
- **Popup:** paste project key → stored in `chrome.storage`. Shows which project is active.
- **Content script:**
  - "Tag mode" toggle. In tag mode, hovering highlights elements; clicking one opens a comment box; submit calls `create_tag`.
  - On load (when a project key is set), calls `get_tags(key, page_url)` and draws a pin on each re-found element. Unanchored tags listed separately.
- **Supabase access:** `supabase-js` calling only the two RPC functions with the project's anon key.

## 7. Admin Panel

- **Stack:** **Next.js** (App Router) + Supabase Auth + Tailwind.
- **Screens:**
  - Login (Supabase Auth).
  - Project list — the admin's projects; create a project (name + site_url → generates `project_key` to share).
  - Project detail — table of tags: comment, page_url, created_at, and a **status dropdown** (`new`/`in_progress`/`resolved`). Filter by status.
- No reply, no assignment in v1.

## 8. Error handling

- **Invalid/unknown project key:** RPC returns an error; extension shows "invalid project key", no crash.
- **Element not found on re-anchor:** tag routed to the unanchored list, not drawn.
- **Network failure on submit:** extension keeps the comment text and surfaces a retry; does not silently drop.
- **Unauthorized panel access:** RLS returns nothing; unauthenticated users are redirected to login.

## 9. Testing

- **Postgres:** a check that `create_tag` rejects a bad key and accepts a good one; that `get_tags` only returns the requested project's tags. RLS: an admin cannot read another owner's tags.
- **Extension:** anchor generate → re-find round-trip on a sample DOM (the one piece of non-trivial logic).
- **Panel:** status change persists and is scoped to the owner.

## 10. Build order (for the plan)

1. Supabase schema + RPC functions + RLS.
2. Admin panel: auth, project CRUD, tag list + status.
3. Extension: popup key storage, tag creation, pin rendering.

Each layer is usable before the next: the panel can be exercised with seed data before the extension exists.
