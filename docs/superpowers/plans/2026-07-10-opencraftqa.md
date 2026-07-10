# OpenCraftQA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot from a private admin panel to public, shareable, 7-day-expiring QA lists: projects are created in the extension, tags capture screenshots, and each list is viewable at `opencraftqa.com/<slug>` with locate links and copy-to-clipboard AI-fix prompts.

**Architecture:** Supabase Postgres + Storage behind anon `SECURITY DEFINER` RPCs (no auth anywhere). The Next app becomes a public `/[slug]` list viewer on Vercel. The MV3 extension holds your projects locally, creates them via RPC, tags with an inline comment + screenshot, and opens the slug URL.

**Tech Stack:** Supabase (Postgres, Storage, pg_cron), Next.js 16 App Router + `@supabase/supabase-js` (anon, no SSR cookies), Vite + React + `@crxjs/vite-plugin` (MV3) with a background service worker, Vitest.

## Global Constraints

- No authentication anywhere. All DB access is via anon RPCs; tables are never granted to `anon`. Storage bucket `screenshots` is public-read, anon-insert.
- Statuses are exactly `new` | `in_progress` | `resolved`; default `new`.
- `projects` has `slug` (public view id) and `project_key` (extension write credential) — two distinct ids. `slug` is url-safe ~10 chars; `project_key` is 32 hex chars.
- Anchor shape (unchanged): `{ selector: string; text: string | null; nthOfType: number | null; tagName: string }`.
- Screenshot Storage path: `<slug>/<random-uuid>.png` (filename minted client-side; tag id does not exist at upload time).
- Expiry: a project is deleted when `last_active_at < now() - interval '7 days'`; `create_tag` and `set_status` bump `last_active_at`.
- RPC signatures (fixed):
  - `create_project(p_name text, p_site_url text) returns table(slug text, project_key text)`
  - `create_tag(p_project_key text, p_anchor jsonb, p_comment text, p_page_url text, p_screenshot_path text) returns uuid`
  - `get_list(p_slug text) returns jsonb`  (`{ project, tags[] }` or `null`)
  - `get_tags(p_project_key text, p_page_url text) returns setof tags`
  - `get_tag(p_tag_id uuid) returns table(anchor jsonb, page_url text)`
  - `set_status(p_tag_id uuid, p_status text) returns void`
- AI-fix prompt template is the exact text in Task 2.2.
- App base URL comes from env: web `NEXT_PUBLIC_APP_URL`, extension `VITE_APP_URL` (dev `http://localhost:3000`, prod `https://opencraftqa.com`). View-list opens `${APP_URL}/${slug}`.

---

## Phase 1 — Database, Storage, expiry

**Prerequisite:** Docker running, `supabase start` up (already true in this repo's dev env).

### Task 1.1: Schema migration (slug, last_active_at, screenshot_path, drop owner)

**Files:**
- Create: `supabase/migrations/0004_pivot_schema.sql`
- Test: `supabase/tests/pivot_schema.sql`

**Interfaces:**
- Consumes: existing `projects`, `tags`, and the owner-based RLS from `0002_rls.sql`.
- Produces: `projects(id, name, site_url, slug unique, project_key unique, created_at, last_active_at)` and `tags(..., screenshot_path text null)`; a `gen_token(len int) returns text` helper; RLS enabled with no policies (direct access denied, RPC-only).

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/pivot_schema.sql`:
```sql
do $$
begin
  -- new columns exist, owner is gone
  perform 1 from information_schema.columns where table_name='projects' and column_name='slug';
  assert found, 'projects.slug missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='last_active_at';
  assert found, 'projects.last_active_at missing';
  perform 1 from information_schema.columns where table_name='tags' and column_name='screenshot_path';
  assert found, 'tags.screenshot_path missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='owner';
  assert not found, 'projects.owner should be dropped';
end $$;
-- slug/key generator produces url-safe, correct-length tokens
do $$
declare s text; begin
  s := gen_token(10);
  assert length(s) >= 10, 'gen_token too short';
  assert s ~ '^[A-Za-z0-9_-]+$', 'gen_token not url-safe';
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -f supabase/tests/pivot_schema.sql
```
Expected: FAIL — `slug` column and `gen_token` do not exist.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/0004_pivot_schema.sql`:
```sql
-- URL-safe token generator (base64url of random bytes, trimmed to length)
create or replace function gen_token(len int) returns text language sql volatile as $$
  select left(replace(replace(encode(gen_random_bytes(len), 'base64'), '/', '_'), '+', '-'), len);
$$;

-- Drop the owner-based, auth-dependent RLS policies (going fully public/RPC-only)
drop policy if exists projects_owner on projects;
drop policy if exists tags_owner on tags;

-- projects: drop owner, add slug + last_active_at
alter table projects drop column if exists owner;
alter table projects add column if not exists slug text unique;
alter table projects add column if not exists last_active_at timestamptz not null default now();
update projects set slug = gen_token(10) where slug is null;
alter table projects alter column slug set not null;

-- tags: add screenshot_path
alter table tags add column if not exists screenshot_path text;

-- RLS stays ON with NO policies: direct table access denied; RPCs (SECURITY DEFINER) only.
-- (revokes from 0002 remain in effect for anon.)
```

- [ ] **Step 4: Run to verify it passes**

Run the Step 2 commands again.
Expected: PASS (no assertion raised).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0004_pivot_schema.sql supabase/tests/pivot_schema.sql
git commit -m "feat(db): pivot schema — slug, last_active_at, screenshot_path, drop owner"
```

### Task 1.2: RPCs (create_project, create_tag, get_list, get_tag, set_status; keep get_tags)

**Files:**
- Create: `supabase/migrations/0005_rpc.sql`
- Test: `supabase/tests/pivot_rpc.sql`

**Interfaces:**
- Consumes: Task 1.1 schema, `gen_token`.
- Produces: the six RPCs in Global Constraints, all `security definer`, granted to `anon`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/pivot_rpc.sql`:
```sql
set local role anon;
do $$
declare v_slug text; v_key text; v_id uuid; v_list jsonb;
begin
  select slug, project_key into v_slug, v_key from create_project('Acme', 'https://acme.store');
  assert v_slug is not null and v_key is not null, 'create_project must return slug+key';

  v_id := create_tag(v_key, '{"selector":"button.cta","text":null,"nthOfType":null,"tagName":"button"}'::jsonb,
                     'overlaps on mobile', 'https://acme.store/checkout', 'acme/x.png');
  assert v_id is not null, 'create_tag returns id';

  v_list := get_list(v_slug);
  assert v_list->'project'->>'name' = 'Acme', 'get_list project name';
  assert jsonb_array_length(v_list->'tags') = 1, 'get_list has 1 tag';
  assert (v_list->'tags'->0->>'screenshot_path') = 'acme/x.png', 'screenshot_path stored';

  perform set_status(v_id, 'resolved');
  v_list := get_list(v_slug);
  assert (v_list->'tags'->0->>'status') = 'resolved', 'set_status applied';

  assert get_list('nope') is null, 'unknown slug -> null';

  -- get_tag resolves anchor + page_url
  perform 1 from get_tag(v_id) where page_url = 'https://acme.store/checkout';
  assert found, 'get_tag returns page_url';

  -- bad key raises
  begin
    perform create_tag('BADKEY', '{}'::jsonb, 'x', 'u', null);
    assert false, 'bad key must raise';
  exception when others then null; end;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -f supabase/tests/pivot_rpc.sql
```
Expected: FAIL — `create_project` does not exist.

- [ ] **Step 3: Write the RPCs**

Create `supabase/migrations/0005_rpc.sql`:
```sql
-- Replace the old 4-arg create_tag (from 0003) with the 5-arg version.
drop function if exists create_tag(text, jsonb, text, text);

create function create_project(p_name text, p_site_url text)
returns table(slug text, project_key text)
language plpgsql security definer set search_path = public as $$
declare v_slug text; v_key text;
begin
  v_slug := gen_token(10);
  v_key  := replace(gen_random_uuid()::text, '-', '');
  insert into projects (name, site_url, slug, project_key)
  values (p_name, p_site_url, v_slug, v_key);
  slug := v_slug; project_key := v_key; return next;
end $$;

create function create_tag(p_project_key text, p_anchor jsonb, p_comment text,
                           p_page_url text, p_screenshot_path text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_project uuid; v_id uuid;
begin
  select id into v_project from projects where project_key = p_project_key;
  if v_project is null then raise exception 'invalid project key'; end if;
  insert into tags (project_id, page_url, anchor, comment, screenshot_path)
  values (v_project, p_page_url, p_anchor, p_comment, p_screenshot_path)
  returning id into v_id;
  update projects set last_active_at = now() where id = v_project;
  return v_id;
end $$;

create function get_list(p_slug text)
returns jsonb language sql security definer set search_path = public stable as $$
  select case when p.id is null then null else jsonb_build_object(
    'project', jsonb_build_object('name', p.name, 'site_url', p.site_url,
                                  'slug', p.slug, 'last_active_at', p.last_active_at),
    'tags', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'page_url', t.page_url, 'anchor', t.anchor, 'comment', t.comment,
        'status', t.status, 'screenshot_path', t.screenshot_path, 'created_at', t.created_at
      ) order by t.created_at desc)
      from tags t where t.project_id = p.id), '[]'::jsonb)
  ) end
  from projects p where p.slug = p_slug;
$$;

create function get_tag(p_tag_id uuid)
returns table(anchor jsonb, page_url text)
language sql security definer set search_path = public stable as $$
  select anchor, page_url from tags where id = p_tag_id;
$$;

create function set_status(p_tag_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('new','in_progress','resolved') then
    raise exception 'invalid status';
  end if;
  update tags set status = p_status where id = p_tag_id;
  update projects p set last_active_at = now()
    from tags t where t.id = p_tag_id and p.id = t.project_id;
end $$;

grant execute on function create_project(text, text)              to anon;
grant execute on function create_tag(text, jsonb, text, text, text) to anon;
grant execute on function get_list(text)                          to anon;
grant execute on function get_tag(uuid)                           to anon;
grant execute on function set_status(uuid, text)                  to anon;
-- get_tags(text,text) grant persists from 0003.
```

- [ ] **Step 4: Run to verify it passes**

Run the Step 2 commands again.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0005_rpc.sql supabase/tests/pivot_rpc.sql
git commit -m "feat(db): public RPCs — create_project, create_tag(+screenshot), get_list, get_tag, set_status"
```

### Task 1.3: Storage bucket + policies

**Files:**
- Create: `supabase/migrations/0006_storage.sql`
- Test: `supabase/tests/storage.sql`

**Interfaces:**
- Produces: a public `screenshots` bucket; anon may INSERT objects, everyone may SELECT (read).

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/storage.sql`:
```sql
do $$
begin
  perform 1 from storage.buckets where id = 'screenshots' and public = true;
  assert found, 'screenshots bucket missing or not public';
  perform 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname = 'screenshots_anon_insert';
  assert found, 'anon insert policy missing';
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -f supabase/tests/storage.sql
```
Expected: FAIL — bucket does not exist.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/0006_storage.sql`:
```sql
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Public read is implied by public=true; add explicit anon INSERT policy.
create policy screenshots_anon_insert on storage.objects
  for insert to anon
  with check (bucket_id = 'screenshots');

create policy screenshots_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'screenshots');
```

- [ ] **Step 4: Run to verify it passes**

Run the Step 2 commands again.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_storage.sql supabase/tests/storage.sql
git commit -m "feat(db): screenshots storage bucket, public read + anon insert"
```

### Task 1.4: Expiry purge (function + pg_cron)

**Files:**
- Create: `supabase/migrations/0007_expiry.sql`
- Test: `supabase/tests/expiry.sql`

**Interfaces:**
- Produces: `purge_expired() returns int` (deletes projects inactive >7 days and their storage objects, returns count); a daily pg_cron schedule calling it.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/expiry.sql`:
```sql
-- seed: one stale, one fresh
insert into projects (name, site_url, slug, project_key, last_active_at) values
  ('Stale','https://s','staleslug1','k1', now() - interval '8 days'),
  ('Fresh','https://f','freshslug1','k2', now() - interval '1 day');
do $$
declare removed int;
begin
  removed := purge_expired();
  assert removed = 1, 'exactly one stale project purged';
  perform 1 from projects where slug = 'staleslug1';
  assert not found, 'stale project gone';
  perform 1 from projects where slug = 'freshslug1';
  assert found, 'fresh project kept';
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -f supabase/tests/expiry.sql
```
Expected: FAIL — `purge_expired` does not exist.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/0007_expiry.sql`:
```sql
create extension if not exists pg_cron;

create or replace function purge_expired() returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  -- remove screenshots for projects about to be deleted
  delete from storage.objects
  where bucket_id = 'screenshots'
    and split_part(name, '/', 1) in (
      select slug from projects where last_active_at < now() - interval '7 days');

  with del as (
    delete from projects where last_active_at < now() - interval '7 days' returning 1)
  select count(*) into v_count from del;
  return v_count;
end $$;

-- Daily at 03:00 UTC. unschedule first to stay idempotent on re-run.
select cron.unschedule('purge_expired') where exists (
  select 1 from cron.job where jobname = 'purge_expired');
select cron.schedule('purge_expired', '0 3 * * *', $$select purge_expired();$$);
```

- [ ] **Step 4: Run to verify it passes**

Run the Step 2 commands again.
Expected: PASS (`removed = 1`).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0007_expiry.sql supabase/tests/expiry.sql
git commit -m "feat(db): purge_expired + daily pg_cron for 7-day inactivity cleanup"
```

---

## Phase 2 — Web app (public list viewer)

### Task 2.1: Strip auth; plain anon Supabase client

**Files:**
- Delete: `panel/app/login/`, `panel/proxy.ts`, `panel/app/(app)/` (the whole group: `layout.tsx`, `page.tsx`, `actions.ts`, `NavLink.tsx`, `icons.tsx`, `CopyKey.tsx`, `projects/`)
- Delete: `panel/lib/supabase/server.ts`, `panel/lib/supabase/client.ts`
- Create: `panel/lib/supabase.ts`
- Modify: `panel/app/layout.tsx` (unchanged fonts; keep)

**Interfaces:**
- Produces: `sb` — a plain anon `@supabase/supabase-js` client usable in server components and server actions; `screenshotUrl(path)`.

- [ ] **Step 1: Delete auth + admin surfaces**

Run:
```bash
cd panel
git rm -r "app/login" "app/(app)" proxy.ts lib/supabase/server.ts lib/supabase/client.ts
cd ..
```

- [ ] **Step 2: Create the anon client + storage URL helper**

Create `panel/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const sb = createClient(url, anon)

export function screenshotUrl(path: string): string {
  return `${url}/storage/v1/object/public/screenshots/${path}`
}
```

- [ ] **Step 3: Add app base URL to env**

Append to `panel/.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Verify build fails only on the not-yet-created page**

Run: `cd panel && npm run build`
Expected: build FAILS because `/` route was deleted (no `app/page.tsx` yet). That is fixed in Task 2.3/2.4. If any error mentions the deleted auth files, remove the stray import.

- [ ] **Step 5: Commit**

```bash
git add -A panel/
git commit -m "refactor(web): remove auth, sidebar, admin pages; add anon supabase client"
```

### Task 2.2: AI-fix prompt builders (pure, unit-tested)

**Files:**
- Create: `panel/lib/prompt.ts`
- Test: `panel/lib/prompt.test.ts`
- Create: `panel/lib/types.ts`

**Interfaces:**
- Produces:
  - `type Status = 'new'|'in_progress'|'resolved'`
  - `type Anchor = { selector: string; text: string|null; nthOfType: number|null; tagName: string }`
  - `type Tag = { id: string; page_url: string; anchor: Anchor; comment: string; status: Status; screenshot_path: string|null; created_at: string }`
  - `buildPrompt(t: Tag): string`
  - `buildBulkPrompt(tags: Tag[]): string` (open items only, i.e. status !== 'resolved')

- [ ] **Step 1: Write the failing test**

Create `panel/lib/prompt.test.ts`:
```ts
import { expect, test } from 'vitest'
import { buildPrompt, buildBulkPrompt } from './prompt'
import type { Tag } from './types'

const tag = (over: Partial<Tag> = {}): Tag => ({
  id: '1', page_url: 'https://acme.store/checkout',
  anchor: { selector: 'button.cta', text: null, nthOfType: null, tagName: 'button' },
  comment: 'button text overlaps on mobile', status: 'new',
  screenshot_path: null, created_at: '', ...over,
})

test('buildPrompt includes url, comment, element, status', () => {
  const p = buildPrompt(tag())
  expect(p).toContain('Fix this UI issue on https://acme.store/checkout:')
  expect(p).toContain('Problem: "button text overlaps on mobile"')
  expect(p).toContain('Element: <button>  (selector: button.cta)')
  expect(p).toContain('Status: new')
  expect(p).toContain('Apply a minimal, accessible fix consistent with the existing design system.')
})

test('buildBulkPrompt lists only open items', () => {
  const p = buildBulkPrompt([tag({ id: 'a' }), tag({ id: 'b', status: 'resolved' })])
  expect(p).toContain('Fix the following 1 UI issues')
  expect((p.match(/acme.store/g) ?? []).length).toBe(1)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd panel && npm test`
Expected: FAIL — `./prompt` and `./types` do not exist.

- [ ] **Step 3: Implement**

Create `panel/lib/types.ts`:
```ts
export type Status = 'new' | 'in_progress' | 'resolved'
export type Anchor = { selector: string; text: string | null; nthOfType: number | null; tagName: string }
export type Tag = {
  id: string; page_url: string; anchor: Anchor; comment: string
  status: Status; screenshot_path: string | null; created_at: string
}
export const STATUSES: Status[] = ['new', 'in_progress', 'resolved']
export const isValidStatus = (s: string): s is Status => (STATUSES as string[]).includes(s)
export const STATUS_META: Record<Status, { label: string; color: string; soft: string }> = {
  new:         { label: 'New',         color: 'var(--color-new)',      soft: 'var(--color-new-soft)' },
  in_progress: { label: 'In progress', color: 'var(--color-progress)', soft: 'var(--color-progress-soft)' },
  resolved:    { label: 'Resolved',    color: 'var(--color-resolved)', soft: 'var(--color-resolved-soft)' },
}
```

Create `panel/lib/prompt.ts`:
```ts
import type { Tag } from './types'

export function buildPrompt(t: Tag): string {
  return `Fix this UI issue on ${t.page_url}:

Problem: "${t.comment}"
Element: <${t.anchor.tagName}>  (selector: ${t.anchor.selector})
Status: ${t.status}

Apply a minimal, accessible fix consistent with the existing design system.`
}

export function buildBulkPrompt(tags: Tag[]): string {
  const open = tags.filter((t) => t.status !== 'resolved')
  const items = open.map((t, i) =>
    `${i + 1}. On ${t.page_url} — "${t.comment}" (element <${t.anchor.tagName}>, selector ${t.anchor.selector})`
  ).join('\n')
  return `Fix the following ${open.length} UI issues. Apply minimal, accessible fixes consistent with the existing design system.\n\n${items}`
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd panel && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add panel/lib/prompt.ts panel/lib/prompt.test.ts panel/lib/types.ts
git commit -m "feat(web): AI-fix prompt builders + shared types"
```

### Task 2.3: Public `/[slug]` list page

**Files:**
- Create: `panel/app/[slug]/page.tsx`
- Create: `panel/app/[slug]/StatusSelect.tsx`
- Create: `panel/app/[slug]/CopyButton.tsx`
- Create: `panel/app/actions.ts`

**Interfaces:**
- Consumes: `sb`, `screenshotUrl` (2.1); `buildPrompt`, `buildBulkPrompt`, `Tag`, `STATUS_META` (2.2); RPCs `get_list`, `set_status`.
- Produces: the public list view; `setStatus(tagId, status)` server action.

- [ ] **Step 1: Public set_status action**

Create `panel/app/actions.ts`:
```ts
'use server'
import { revalidatePath } from 'next/cache'
import { sb } from '@/lib/supabase'
import { isValidStatus } from '@/lib/types'

export async function setStatus(slug: string, tagId: string, status: string) {
  if (!isValidStatus(status)) throw new Error('bad status')
  const { error } = await sb.rpc('set_status', { p_tag_id: tagId, p_status: status })
  if (error) throw new Error(error.message)
  revalidatePath(`/${slug}`)
}
```

- [ ] **Step 2: Client copy button (AI-fix)**

Create `panel/app/[slug]/CopyButton.tsx`:
```tsx
'use client'
import { useState } from 'react'

export function CopyButton({ text, label = 'AI Fix', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200) }}
      className={className}
    >
      {done ? 'Copied' : label}
    </button>
  )
}
```

- [ ] **Step 3: Status select (public)**

Create `panel/app/[slug]/StatusSelect.tsx`:
```tsx
'use client'
import { useState, useTransition } from 'react'
import { STATUSES, STATUS_META, type Status } from '@/lib/types'
import { setStatus } from '../actions'

export function StatusSelect({ slug, tagId, value }: { slug: string; tagId: string; value: Status }) {
  const [current, setCurrent] = useState<Status>(value)
  const [pending, start] = useTransition()
  const m = STATUS_META[current]
  return (
    <div className="relative inline-flex items-center rounded-full" style={{ backgroundColor: m.soft }}>
      <span aria-hidden className="pointer-events-none absolute left-3 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      <select
        value={current} disabled={pending} aria-label="Status"
        onChange={(e) => { const n = e.target.value as Status; setCurrent(n); start(() => setStatus(slug, tagId, n)) }}
        className="ring-accent cursor-pointer appearance-none rounded-full bg-transparent py-1 pl-6 pr-7 text-[0.8125rem] font-medium focus:outline-none disabled:opacity-60"
        style={{ color: m.color }}
      >
        {STATUSES.map((s) => <option key={s} value={s} className="bg-surface text-ink">{STATUS_META[s].label}</option>)}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-[0.7rem]" style={{ color: m.color }}>▾</span>
    </div>
  )
}
```

- [ ] **Step 4: The page**

Create `panel/app/[slug]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { sb, screenshotUrl } from '@/lib/supabase'
import { buildPrompt, buildBulkPrompt } from '@/lib/prompt'
import type { Tag } from '@/lib/types'
import { StatusSelect } from './StatusSelect'
import { CopyButton } from './CopyButton'

function daysLeft(lastActive: string): number {
  const ms = new Date(lastActive).getTime() + 7 * 864e5 - Date.now()
  return Math.max(0, Math.ceil(ms / 864e5))
}

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await sb.rpc('get_list', { p_slug: slug })
  if (!data) notFound()
  const project = data.project as { name: string; site_url: string; last_active_at: string }
  const tags = (data.tags ?? []) as Tag[]

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem] font-medium tracking-tight text-ink">{project.name}</h1>
          <a href={project.site_url} target="_blank" rel="noreferrer" className="mono text-[0.8125rem] text-accent hover:underline">{project.site_url}</a>
          <p className="mt-1 text-[0.75rem] text-ink-mute">Expires in {daysLeft(project.last_active_at)} days</p>
        </div>
        {tags.length > 0 && (
          <CopyButton
            text={buildBulkPrompt(tags)} label="Copy AI Fix for all"
            className="ring-accent shadow-bar rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-accent-ink hover:bg-accent-press"
          />
        )}
      </div>

      {tags.length ? (
        <ul className="flex flex-col gap-3">
          {tags.map((t) => (
            <li key={t.id} className="shadow-card flex gap-4 rounded-xl border border-line bg-surface p-4">
              <a href={`${t.page_url}#qa-locate=${t.id}`} target="_blank" rel="noreferrer"
                 className="ring-accent block h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-bg" title="Open and locate on the live page">
                {t.screenshot_path
                  ? <img src={screenshotUrl(t.screenshot_path)} alt="" className="h-full w-full object-cover" />
                  : <span className="grid h-full w-full place-items-center text-[0.6875rem] text-ink-mute">no shot</span>}
              </a>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] text-ink">{t.comment}</p>
                <p className="mono mt-1 truncate text-[0.75rem] text-ink-mute">
                  {new URL(t.page_url).pathname} · &lt;{t.anchor.tagName}&gt;
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <StatusSelect slug={slug} tagId={t.id} value={t.status} />
                  <CopyButton text={buildPrompt(t)} className="ring-accent rounded-md px-2 py-1 text-[0.8125rem] font-medium text-accent hover:bg-accent-soft" />
                  <a href={`${t.page_url}#qa-locate=${t.id}`} target="_blank" rel="noreferrer" className="text-[0.8125rem] text-ink-dim hover:text-accent">Locate</a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="shadow-card rounded-xl border border-line bg-surface px-6 py-14 text-center">
          <p className="text-[0.9375rem] font-medium text-ink">No tags yet</p>
          <p className="mt-1 text-[0.8125rem] text-ink-dim">Tag components with the extension to fill this list.</p>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 5: Verify**

Seed a list and view it:
```bash
DBURL="$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')"
SLUG=$(psql "$DBURL" -tAc "select slug from create_project('Demo','https://demo.test');" | tr -d ' ')
psql "$DBURL" -tAc "select create_tag((select project_key from projects where slug='$SLUG'), '{\"selector\":\"h1\",\"text\":null,\"nthOfType\":null,\"tagName\":\"h1\"}'::jsonb, 'headline too small', 'https://demo.test/', null);" >/dev/null
cd panel && npm run build && curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/$SLUG"
```
Expected: build passes; the list route returns 200 (run `npm run dev` to view). Unknown slug returns the 404 page.

- [ ] **Step 6: Commit**

```bash
git add "panel/app/[slug]" panel/app/actions.ts
git commit -m "feat(web): public /[slug] list with screenshot, locate, status, AI-fix"
```

### Task 2.4: Root landing + not-found

**Files:**
- Create: `panel/app/page.tsx`
- Create: `panel/app/not-found.tsx`

**Interfaces:**
- Produces: a minimal `/` explaining the tool; a friendly 404 for unknown/expired lists.

- [ ] **Step 1: Landing page**

Create `panel/app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-6 text-center">
      <div>
        <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-ink shadow-bar">
          <span className="text-[1.1rem] font-bold">Q</span>
        </span>
        <h1 className="text-[1.5rem] font-medium tracking-tight text-ink">OpenCraftQA</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-dim">
          Tag UI issues on any site with the browser extension, then share a link to the list. Links expire after 7 days of inactivity.
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Not-found page**

Create `panel/app/not-found.tsx`:
```tsx
export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-lg place-items-center px-6 text-center">
      <div>
        <h1 className="text-[1.25rem] font-medium text-ink">List not found</h1>
        <p className="mt-1 text-[0.875rem] text-ink-dim">This list does not exist or has expired.</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `cd panel && npm run build`
Expected: build succeeds; `/` renders the landing, unknown slug renders not-found.

- [ ] **Step 4: Commit**

```bash
git add panel/app/page.tsx panel/app/not-found.tsx
git commit -m "feat(web): landing page and friendly not-found"
```

---

## Phase 3 — Extension

### Task 3.1: RPC + storage + project-memory helpers

**Files:**
- Modify: `extension/src/supabase.ts`
- Create: `extension/src/projects.ts`
- Create: `extension/.env` (append `VITE_APP_URL`)

**Interfaces:**
- Consumes: RPCs from Phase 1.
- Produces:
  - in `supabase.ts`: `sb`; `createProject(name, siteUrl): Promise<{slug:string; project_key:string}>`; `createTag(key, anchor, comment, pageUrl, screenshotPath|null): Promise<void>`; `getTags(key, pageUrl)`; `getTag(id): Promise<{anchor:Anchor; page_url:string}|null>`; `uploadScreenshot(slug, blob): Promise<string>` (returns storage path).
  - in `projects.ts`: `type Project = {name:string; slug:string; project_key:string}`; `listProjects(): Promise<Project[]>`; `addProject(p): Promise<void>`; `getActive(): Promise<Project|null>`; `setActive(slug): Promise<void>`.

- [ ] **Step 1: Env**

Append to `extension/.env`:
```
VITE_APP_URL=http://localhost:3000
```

- [ ] **Step 2: Rewrite `supabase.ts`**

Replace `extension/src/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
import type { Anchor } from './anchor'

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export async function createProject(name: string, siteUrl: string) {
  const { data, error } = await sb.rpc('create_project', { p_name: name, p_site_url: siteUrl })
  if (error) throw new Error(error.message)
  return (Array.isArray(data) ? data[0] : data) as { slug: string; project_key: string }
}

export async function createTag(
  key: string, anchor: Anchor, comment: string, pageUrl: string, screenshotPath: string | null,
) {
  const { error } = await sb.rpc('create_tag', {
    p_project_key: key, p_anchor: anchor, p_comment: comment,
    p_page_url: pageUrl, p_screenshot_path: screenshotPath,
  })
  if (error) throw new Error(error.message)
}

export async function getTags(key: string, pageUrl: string) {
  const { data } = await sb.rpc('get_tags', { p_project_key: key, p_page_url: pageUrl })
  return (data ?? []) as { id: string; anchor: Anchor; comment: string }[]
}

export async function getTag(id: string) {
  const { data } = await sb.rpc('get_tag', { p_tag_id: id })
  const row = Array.isArray(data) ? data[0] : data
  return (row ?? null) as { anchor: Anchor; page_url: string } | null
}

export async function uploadScreenshot(slug: string, blob: Blob): Promise<string> {
  const path = `${slug}/${crypto.randomUUID()}.png`
  const { error } = await sb.storage.from('screenshots').upload(path, blob, { contentType: 'image/png' })
  if (error) throw new Error(error.message)
  return path
}
```

- [ ] **Step 3: Project memory helpers**

Create `extension/src/projects.ts`:
```ts
export type Project = { name: string; slug: string; project_key: string }

export async function listProjects(): Promise<Project[]> {
  const { projects } = await chrome.storage.local.get('projects')
  return (projects ?? []) as Project[]
}
export async function addProject(p: Project): Promise<void> {
  const projects = await listProjects()
  await chrome.storage.local.set({ projects: [...projects, p], activeSlug: p.slug })
}
export async function getActive(): Promise<Project | null> {
  const { activeSlug } = await chrome.storage.local.get('activeSlug')
  if (!activeSlug) return null
  return (await listProjects()).find((p) => p.slug === activeSlug) ?? null
}
export async function setActive(slug: string): Promise<void> {
  await chrome.storage.local.set({ activeSlug: slug })
}
```

- [ ] **Step 4: Verify build**

Run: `cd extension && npm run build`
Expected: build succeeds (the popup still uses old `getKey`/`setKey` until Task 3.2 — leave them exported temporarily OR update the popup in the same task; if the build errors on missing `getKey`, proceed to 3.2 which replaces the popup).

Note: if `getKey`/`setKey` are removed here and the popup still imports them, the build breaks. To keep this task self-contained, temporarily keep `getKey`/`setKey` in `supabase.ts` and remove them in Task 3.2.

- [ ] **Step 5: Commit**

```bash
git add extension/src/supabase.ts extension/src/projects.ts extension/.env.example 2>/dev/null; git add extension/src/supabase.ts extension/src/projects.ts
git commit -m "feat(ext): RPC/storage helpers and local project memory"
```

### Task 3.2: Popup — project dropdown, create, view list

**Files:**
- Modify: `extension/src/Popup.tsx`
- Modify: `extension/src/supabase.ts` (remove temporary `getKey`/`setKey` if present)

**Interfaces:**
- Consumes: `createProject` (3.1 supabase), `listProjects`/`addProject`/`getActive`/`setActive` (3.1 projects), `VITE_APP_URL`.
- Produces: a popup that selects/creates a project and opens the list URL.

- [ ] **Step 1: Rewrite the popup**

Replace `extension/src/Popup.tsx`:
```tsx
import { useEffect, useState } from 'react'
import './popup.css'
import { createProject } from './supabase'
import { listProjects, addProject, getActive, setActive, type Project } from './projects'

export function Popup() {
  const [projects, setProjects] = useState<Project[]>([])
  const [active, setActiveState] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listProjects().then(setProjects)
    getActive().then((p) => p && setActiveState(p.slug))
  }, [])

  const onSelect = async (slug: string) => { setActiveState(slug); await setActive(slug) }

  const onCreate = async () => {
    if (!name.trim() || !siteUrl.trim()) return
    setBusy(true)
    try {
      const { slug, project_key } = await createProject(name.trim(), siteUrl.trim())
      const p = { name: name.trim(), slug, project_key }
      await addProject(p)
      setProjects(await listProjects()); setActiveState(slug)
      setCreating(false); setName(''); setSiteUrl('')
    } catch (e) { alert('Could not create project: ' + (e as Error).message) }
    finally { setBusy(false) }
  }

  const openList = () => {
    if (active) chrome.tabs.create({ url: `${import.meta.env.VITE_APP_URL}/${active}` })
  }

  return (
    <div className="qa-popup">
      <header className="qa-head">
        <span className="qa-mark">Q</span>
        <div><div className="qa-title">OpenCraftQA</div><div className="qa-sub">Element tagging</div></div>
      </header>

      {!creating ? (
        <>
          <label className="qa-field">
            <span className="qa-label">Active project</span>
            <select className="qa-input" value={active} onChange={(e) => onSelect(e.target.value)}>
              <option value="" disabled>Choose a project…</option>
              {projects.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </label>
          <button className="qa-btn" onClick={openList} disabled={!active}>View list</button>
          <button className="qa-btn qa-btn-ghost" onClick={() => setCreating(true)}>+ New project</button>
        </>
      ) : (
        <>
          <label className="qa-field"><span className="qa-label">Project name</span>
            <input className="qa-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Store" /></label>
          <label className="qa-field"><span className="qa-label">Site URL</span>
            <input className="qa-input" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://acme.store" /></label>
          <button className="qa-btn" onClick={onCreate} disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
          <button className="qa-btn qa-btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add ghost-button style**

Append to `extension/src/popup.css`:
```css
.qa-btn-ghost {
  margin-top: 8px; background: transparent; color: var(--accent);
  box-shadow: none;
}
.qa-btn-ghost:hover { background: var(--accent-soft, oklch(0.95 0.03 256)); }
select.qa-input { cursor: pointer; }
```

- [ ] **Step 3: Remove temporary getKey/setKey**

If Task 3.1 left `getKey`/`setKey` in `supabase.ts`, delete them now (the popup no longer uses them; the content script uses the active project via `getActive`).

- [ ] **Step 4: Verify build + load**

Run: `cd extension && npm run build`. Load `extension/dist`, open the popup: create a project (verify it appears in the panel via its slug URL), reopen popup and confirm it persists in the dropdown, click View list.
Expected: build succeeds; project persists; View list opens `localhost:3000/<slug>`.

- [ ] **Step 5: Commit**

```bash
git add extension/src/Popup.tsx extension/src/popup.css extension/src/supabase.ts
git commit -m "feat(ext): popup project dropdown, create, and view-list"
```

### Task 3.3: Background screenshot capture + crop util

**Files:**
- Modify: `extension/manifest.config.ts` (add `tabs` permission + background service worker)
- Create: `extension/src/background.ts`
- Create: `extension/src/crop.ts`
- Test: `extension/src/crop.test.ts`

**Interfaces:**
- Produces:
  - `cropRect(rect, dpr)` in `crop.ts`: maps a CSS-pixel rect to device-pixel canvas source coords.
  - `background.ts`: on message `{type:'capture'}` replies with a visible-tab PNG data URL.
  - manifest gains `tabs` permission and `background.service_worker`.

- [ ] **Step 1: Write the failing test**

Create `extension/src/crop.test.ts`:
```ts
import { expect, test } from 'vitest'
import { cropRect } from './crop'

test('scales rect by devicePixelRatio and rounds', () => {
  expect(cropRect({ x: 10.4, y: 20.6, width: 100.2, height: 50.7 }, 2)).toEqual({ sx: 21, sy: 41, sw: 200, sh: 101 })
  expect(cropRect({ x: 0, y: 0, width: 50, height: 50 }, 1)).toEqual({ sx: 0, sy: 0, sw: 50, sh: 50 })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd extension && npx vitest run src/crop.test.ts`
Expected: FAIL — `./crop` not found.

- [ ] **Step 3: Implement crop + background**

Create `extension/src/crop.ts`:
```ts
export function cropRect(
  rect: { x: number; y: number; width: number; height: number }, dpr: number,
) {
  return {
    sx: Math.round(rect.x * dpr), sy: Math.round(rect.y * dpr),
    sw: Math.round(rect.width * dpr), sh: Math.round(rect.height * dpr),
  }
}
```

Create `extension/src/background.ts`:
```ts
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'capture') {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl: chrome.runtime.lastError ? null : dataUrl })
    })
    return true // async response
  }
})
```

- [ ] **Step 4: Wire the manifest**

Edit `extension/manifest.config.ts` — add `'tabs'` to `permissions` and a background worker:
```ts
import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'OpenCraftQA',
  version: '0.1.0',
  action: { default_popup: 'index.html' },
  permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
  host_permissions: ['<all_urls>'],
  background: { service_worker: 'src/background.ts', type: 'module' },
  content_scripts: [{ matches: ['<all_urls>'], js: ['src/content.tsx'] }],
})
```

- [ ] **Step 5: Run tests + build**

Run: `cd extension && npx vitest run && npm run build`
Expected: crop test passes (plus the 4 anchor tests); build emits `dist/manifest.json` with `tabs` permission and a background service worker.

- [ ] **Step 6: Commit**

```bash
git add extension/manifest.config.ts extension/src/background.ts extension/src/crop.ts extension/src/crop.test.ts
git commit -m "feat(ext): background capture service worker + crop util"
```

### Task 3.4: Content script — bubble comment, screenshot, locate

**Files:**
- Modify: `extension/src/content.tsx`
- Modify: `extension/src/overlay.css`

**Interfaces:**
- Consumes: `generateAnchor`, `findElement` (anchor); `createTag`, `getTags`, `getTag`, `uploadScreenshot` (supabase); `getActive` (projects); `cropRect` (crop).
- Produces: inline chat-bubble comment box; screenshot capture on send; pin-drawing via active project; locate-on-load via `#qa-locate=<tagId>`.

- [ ] **Step 1: Rewrite the tag flow in `content.tsx`**

Replace the tag-mode section of `extension/src/content.tsx` (keep `loadPins` structure but source the key from the active project; replace `prompt()` with the bubble box; add screenshot + locate). Full file:
```tsx
import { generateAnchor, findElement, type Anchor } from './anchor'
import { createTag, getTags, getTag, uploadScreenshot } from './supabase'
import { getActive } from './projects'
import { cropRect } from './crop'
import './overlay.css'

// ---- pins for the active project ----
async function loadPins() {
  const active = await getActive()
  if (!active) return
  const rows = await getTags(active.project_key, location.href)
  for (const r of rows) {
    const el = findElement(r.anchor)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const pin = document.createElement('div')
    pin.className = 'qa-pin'; pin.title = r.comment
    pin.style.top = `${rect.top + scrollY}px`; pin.style.left = `${rect.left + scrollX}px`
    document.body.appendChild(pin)
  }
}

// ---- screenshot of an element (best-effort) ----
async function screenshot(el: Element, slug: string): Promise<string | null> {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'capture' }) as { dataUrl: string | null }
    if (!resp?.dataUrl) return null
    const img = new Image(); img.src = resp.dataUrl
    await img.decode()
    const r = el.getBoundingClientRect()
    const c = cropRect({ x: r.x, y: r.y, width: r.width, height: r.height }, devicePixelRatio)
    const canvas = document.createElement('canvas'); canvas.width = c.sw; canvas.height = c.sh
    canvas.getContext('2d')!.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, c.sw, c.sh)
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) return null
    return await uploadScreenshot(slug, blob)
  } catch { return null }
}

// ---- inline bubble comment box ----
function askComment(el: Element): Promise<string | null> {
  return new Promise((resolve) => {
    const r = el.getBoundingClientRect()
    const box = document.createElement('div')
    box.className = 'qa-bubble'
    box.style.top = `${r.bottom + scrollY + 8}px`
    box.style.left = `${Math.max(8, r.left + scrollX)}px`
    box.innerHTML = `<textarea class="qa-bubble-input" placeholder="What needs fixing?"></textarea>
      <div class="qa-bubble-row"><button class="qa-bubble-cancel">Cancel</button><button class="qa-bubble-send">Send</button></div>`
    document.body.appendChild(box)
    const ta = box.querySelector('textarea') as HTMLTextAreaElement
    ta.focus()
    const done = (val: string | null) => { box.remove(); resolve(val) }
    box.querySelector('.qa-bubble-cancel')!.addEventListener('click', () => done(null))
    box.querySelector('.qa-bubble-send')!.addEventListener('click', () => done(ta.value.trim() || null))
  })
}

// ---- tag mode ----
let tagging = false
let dim: HTMLDivElement | null = null, hl: HTMLDivElement | null = null, label: HTMLDivElement | null = null
const isOurs = (el: Element | null) => !!el?.closest('.qa-toolbar, .qa-dim, .qa-highlight, .qa-pin, .qa-bubble')
const describe = (el: Element) => `${el.tagName.toLowerCase()}${(el as HTMLElement).id ? `#${(el as HTMLElement).id}` : ''}${el.classList[0] ? `.${el.classList[0]}` : ''}`

function place(el: Element) {
  if (!hl || !label) return
  const r = el.getBoundingClientRect()
  Object.assign(hl.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
  label.textContent = describe(el)
}
function onMove(e: MouseEvent) { const el = e.target as Element; if (isOurs(el)) { if (hl) hl.style.display = 'none'; return } place(el) }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') exitTagMode() }

async function onPick(e: MouseEvent) {
  const el = e.target as Element
  if (isOurs(el)) return
  e.preventDefault(); e.stopPropagation()
  // pause the highlight interactions while the bubble is open
  document.removeEventListener('mousemove', onMove, true)
  if (hl) hl.style.display = 'none'
  const comment = await askComment(el)
  if (!comment) { exitTagMode(); return }
  const active = await getActive()
  if (!active) { alert('Pick a project in the extension first.'); exitTagMode(); return }
  const path = await screenshot(el, active.slug)
  try {
    await createTag(active.project_key, generateAnchor(el), comment, location.href, path)
    location.reload()
  } catch (err) {
    alert('OpenCraftQA: failed to save tag — ' + (err as Error).message)
    exitTagMode()
  }
}

function enterTagMode() {
  if (tagging) return; tagging = true
  dim = document.createElement('div'); dim.className = 'qa-dim'
  hl = document.createElement('div'); hl.className = 'qa-highlight'
  label = document.createElement('div'); label.className = 'qa-hl-label'; hl.appendChild(label)
  document.body.append(dim, hl)
  document.documentElement.classList.add('qa-tagging')
  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('click', onPick, true)
  document.addEventListener('keydown', onKey, true)
  btn.classList.add('qa-active'); btn.textContent = 'Cancel (Esc)'
}
function exitTagMode() {
  if (!tagging) return; tagging = false
  document.removeEventListener('mousemove', onMove, true)
  document.removeEventListener('click', onPick, true)
  document.removeEventListener('keydown', onKey, true)
  dim?.remove(); hl?.remove(); dim = hl = label = null
  document.documentElement.classList.remove('qa-tagging')
  btn.classList.remove('qa-active'); btn.textContent = 'Tag mode'
}

// ---- locate on load (#qa-locate=<tagId>) ----
async function locate() {
  const m = location.hash.match(/qa-locate=([0-9a-f-]+)/i)
  if (!m) return
  const tag = await getTag(m[1])
  if (!tag) return
  const el = findElement(tag.anchor)
  if (!el) return
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  const box = document.createElement('div'); box.className = 'qa-highlight'
  document.body.appendChild(box)
  const r = el.getBoundingClientRect()
  Object.assign(box.style, { display: 'block', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
  setTimeout(() => box.remove(), 2500)
}

// ---- toolbar ----
const toolbar = document.createElement('div'); toolbar.className = 'qa-toolbar'
const btn = document.createElement('button'); btn.className = 'qa-toolbar-btn'; btn.textContent = 'Tag mode'
btn.onclick = () => (tagging ? exitTagMode() : enterTagMode())
toolbar.appendChild(btn); document.body.appendChild(toolbar)
loadPins()
locate()
```

- [ ] **Step 2: Bubble styles**

Append to `extension/src/overlay.css`:
```css
.qa-bubble {
  position: absolute; z-index: 2147483647; width: 260px;
  background: oklch(0.995 0.001 260); color: oklch(0.30 0.012 265);
  border: 1px solid oklch(0.912 0.004 260); border-radius: 12px;
  box-shadow: 0 8px 24px oklch(0.20 0.02 265 / 0.28); padding: 10px;
  font: 400 13px 'Roboto', system-ui, sans-serif;
}
.qa-bubble-input {
  width: 100%; min-height: 62px; resize: vertical; box-sizing: border-box;
  border: 1px solid oklch(0.912 0.004 260); border-radius: 8px; padding: 8px;
  font: inherit; color: inherit; outline: none;
}
.qa-bubble-input:focus { border-color: oklch(0.55 0.17 256); }
.qa-bubble-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.qa-bubble-row button { border: 0; border-radius: 8px; padding: 6px 12px; font: 500 12.5px 'Roboto', system-ui, sans-serif; cursor: pointer; }
.qa-bubble-cancel { background: transparent; color: oklch(0.52 0.014 265); }
.qa-bubble-send { background: oklch(0.55 0.17 256); color: oklch(0.99 0.005 256); }
.qa-bubble-send:hover { background: oklch(0.48 0.16 256); }
```

- [ ] **Step 3: Verify build + tests**

Run: `cd extension && npx vitest run && npm run build`
Expected: all unit tests pass (anchor 4 + crop 2); build emits the content script and CSS. Manual: reload extension, refresh a page, Tag mode → click element → bubble appears → Send → tag saves with a screenshot; opening `<page>#qa-locate=<id>` scrolls to and flashes the element.

- [ ] **Step 4: Commit**

```bash
git add extension/src/content.tsx extension/src/overlay.css
git commit -m "feat(ext): bubble comment, element screenshot, locate-on-load"
```

---

## Self-review notes

- **Spec coverage:** slug+key model (1.1, 1.2); create_project in extension (3.2); create_tag+screenshot (1.2, 3.4); get_list public page (2.3); get_tags pins (3.4); get_tag locate (1.2, 3.4); set_status public (1.2, 2.3); Storage bucket + upload (1.3, 3.1, 3.4); 7-day inactivity purge + cron (1.4); expiry shown (2.3 `daysLeft`); no auth (2.1 strip); screenshot + locate + AI-fix per-item and bulk (2.3, 2.2); bubble comment (3.4); View-list URL (3.2); 404 (2.4). All covered.
- **Deferred (per spec):** accounts, real LLM calls, threads/assignment, tag edit/delete from web — none appear. Correct.
- **Type consistency:** `Anchor` shape identical across `extension/src/anchor.ts` and `panel/lib/types.ts`; statuses identical; RPC param names match between `0005_rpc.sql`, `panel` calls, and `extension/src/supabase.ts`; `get_list` returns `jsonb {project,tags}` consumed as such in 2.3.
- **Known ordering note (3.1→3.2):** `getKey`/`setKey` are kept temporarily in 3.1 and removed in 3.2 so each task builds; called out in both tasks.
