# ClientPin

Tag UI issues on any website with a Chrome extension, then share a link to the list. Anyone with the link can see each tagged component (screenshot + locate link), change its status, and copy a ready-to-paste **AI-fix prompt**. Lists are public by link and are deleted 7 days after their last activity.

No accounts. The extension remembers your projects locally; lists are read by a public `slug`, and only the extension can write (via a per-project `project_key`).

## How it works

```
Chrome Extension (MV3)        Supabase (Postgres + Storage)      Web app (Next.js → Vercel)
 pick / create a project       projects: slug, project_key,       public route /[slug]
 tag element → comment           last_active_at                   screenshot + Locate + status
 capture screenshot            tags: anchor, comment, status,     per-item & bulk AI-fix prompt
 View list → /[slug]             screenshot_path                  no auth, no sidebar
                               anon RPCs only (SECURITY DEFINER)
                               Storage bucket `screenshots`
                               pg_cron: purge >7d inactive
```

- **Tagging** highlights the element under the cursor (inspector-style), you leave a comment in an inline bubble, and a cropped screenshot of the component is captured and uploaded.
- **The list** at `/<slug>` shows every tag with its screenshot; clicking a screenshot opens the live page and scrolls to the element (`#qa-locate=<id>`).
- **AI Fix** copies a prompt (comment + element selector + page URL + status) for a coding assistant. "Copy AI Fix" at the top bundles all open items.

## Repository layout

| Path | What |
|------|------|
| `supabase/` | Postgres migrations, anon RPCs, Storage bucket, pg_cron expiry, SQL tests |
| `panel/` | Next.js 16 web app, the public `/[slug]` list viewer |
| `extension/` | MV3 Chrome extension (Vite + React), popup + content script + background worker |
| `docs/superpowers/` | Design specs and implementation plans |

## Prerequisites

- Node 20+ (developed on 25)
- [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker (for local Supabase)

## Local development

### 1. Start Supabase

```bash
supabase start          # first run pulls Docker images
supabase db reset       # apply all migrations (0001–0007)
supabase status         # note the API URL, anon key, service_role key
```

### 2. Web app (`panel/`)

Create `panel/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `supabase status`>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
cd panel
npm install
npm run dev             # http://localhost:3000
```

`/` is a landing page; `/<slug>` renders a list. Unknown or expired slugs show a friendly not-found.

### 3. Extension (`extension/`)

Create `extension/.env`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`>
VITE_APP_URL=http://localhost:3000
```

```bash
cd extension
npm install
npm run build           # outputs extension/dist
```

Load it in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `extension/dist`. Reload the extension and refresh a page after each rebuild (content scripts only inject on fresh page loads).

### 4. Use it

1. Open the extension popup, **create a project** (name + site URL) or pick one.
2. On any page, click the **Tag mode** button (bottom-right), click an element, type a comment, Send.
3. Click **View list** in the popup to open `http://localhost:3000/<slug>`.

## Data model

```
projects(id, name, site_url, slug UNIQUE, project_key UNIQUE, created_at, last_active_at)
tags(id, project_id, page_url, anchor jsonb, comment, status, screenshot_path, created_at)
  status ∈ {new, in_progress, resolved}
  anchor = { selector, text, nthOfType, tagName }
```

**Access is RPC-only** (tables are never exposed to the `anon` role):

| RPC | Used by | Purpose |
|-----|---------|---------|
| `create_project(name, site_url)` | extension | new project → returns `{slug, project_key}` |
| `create_tag(project_key, anchor, comment, page_url, screenshot_path)` | extension | add a tag, bump activity |
| `get_tags(project_key, page_url)` | extension | draw pins for the active project |
| `get_tag(tag_id)` | extension | resolve an anchor for the Locate flow |
| `get_list(slug)` | web | `{project, tags[]}` for the public page (or null) |
| `set_status(tag_id, status)` | web | public status change, bump activity |

Screenshots live in the public `screenshots` Storage bucket at `<slug>/<uuid>.png`. A daily `pg_cron` job (`purge_expired`) deletes projects inactive for 7 days along with their screenshots.

## Tests

```bash
# Database (against a running local Supabase)
DBURL="$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')"
for t in pivot_schema pivot_rpc storage expiry; do psql "$DBURL" -f "supabase/tests/$t.sql"; done

cd panel && npm test        # prompt builders
cd extension && npx vitest run   # element anchoring + screenshot crop math
```

## Deploy

- **Web app** → Vercel (target domain `opencraftqa.com`). Set the same `NEXT_PUBLIC_*` env vars pointing at your hosted Supabase project.
- **Database** → a hosted Supabase project: run the migrations, and confirm `pg_cron` is enabled for the expiry job.
- **Extension** → rebuild with `VITE_SUPABASE_URL` / `VITE_APP_URL` pointing at production before packaging.

## Notes

- The comment input uses a styled in-page bubble; screenshots are best-effort (a tag still saves if capture fails).
- The **Locate** highlight on the live page needs the extension installed; the screenshot is the always-available visual reference.
