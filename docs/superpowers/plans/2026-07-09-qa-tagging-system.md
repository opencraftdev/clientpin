# QA Tagging System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that lets anonymous clients tag/comment on page elements, plus a Next.js admin panel to triage those tags through a status lifecycle, backed by Supabase.

**Architecture:** Supabase Postgres holds `projects` and `tags`. Anonymous clients reach the DB only through two `SECURITY DEFINER` RPC functions gated on a project key. Admins use the Next.js panel with Supabase Auth + RLS scoped to projects they own. The extension (React/MV3) generates a resilient element anchor, calls the RPCs to create tags and draw pins.

**Tech Stack:** Supabase (Postgres, CLI, local Docker), Next.js 15 (App Router) + `@supabase/ssr` + Tailwind, Vite 6 + React 18 + `@crxjs/vite-plugin` (MV3) for the extension, Vitest for unit tests.

## Global Constraints

- Statuses are exactly `new` | `in_progress` | `resolved`; default `new`. Copy verbatim.
- Tables are **never** exposed to the Postgres `anon` role. Anonymous access is only via `create_tag` and `get_tags` RPCs.
- `projects` and `tags` RLS: an authenticated admin may access only rows where the (parent) project's `owner = auth.uid()`.
- Repo layout: `/supabase`, `/panel`, `/extension` — three sibling folders, each self-contained (no monorepo/workspace tooling).
- Anchor shape is `{ selector: string, text: string | null, nthOfType: number | null }`. Same shape in DB `jsonb`, panel, and extension.
- RPC signatures (fixed):
  - `create_tag(p_project_key text, p_anchor jsonb, p_comment text, p_page_url text) returns uuid`
  - `get_tags(p_project_key text, p_page_url text) returns setof tags`

---

## Phase 1 — Supabase schema, RLS, and RPCs

**Prerequisite:** Docker running; Supabase CLI installed (`brew install supabase/tap/supabase`).

### Task 1.1: Initialize Supabase and the schema migration

**Files:**
- Create: `supabase/` (via `supabase init`)
- Create: `supabase/migrations/0001_schema.sql`

**Interfaces:**
- Produces: tables `projects(id, name, site_url, project_key, owner, created_at)` and `tags(id, project_id, page_url, anchor, comment, status, created_at)`.

- [ ] **Step 1: Init Supabase**

Run from repo root:
```bash
mkdir -p supabase && cd supabase && supabase init && cd ..
```
Expected: creates `supabase/config.toml`.

- [ ] **Step 2: Write the schema migration**

Create `supabase/migrations/0001_schema.sql`:
```sql
create table projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  site_url    text not null,
  project_key text not null unique default replace(gen_random_uuid()::text, '-', ''),
  owner       uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table tags (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects (id) on delete cascade,
  page_url    text not null,
  anchor      jsonb not null,
  comment     text not null,
  status      text not null default 'new'
                check (status in ('new', 'in_progress', 'resolved')),
  created_at  timestamptz not null default now()
);

create index tags_project_page_idx on tags (project_id, page_url);
```

- [ ] **Step 3: Apply and verify locally**

Run:
```bash
supabase start
supabase db reset
```
Expected: reset runs `0001_schema.sql` with no error; output lists the migration applied.

- [ ] **Step 4: Commit**

```bash
git add supabase/config.toml supabase/migrations/0001_schema.sql
git commit -m "feat(db): add projects and tags schema"
```

### Task 1.2: RLS policies for admins

**Files:**
- Create: `supabase/migrations/0002_rls.sql`
- Test: `supabase/tests/rls.sql`

**Interfaces:**
- Consumes: `projects`, `tags` from Task 1.1.
- Produces: RLS such that authenticated users touch only their own projects/tags; `anon` gets nothing.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/rls.sql` (run as a script; asserts fail loudly):
```sql
-- Seed two owners and one project each.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'a@x.com'),
  ('00000000-0000-0000-0000-000000000002', 'b@x.com');
insert into projects (id, name, site_url, owner) values
  ('10000000-0000-0000-0000-000000000001', 'A', 'https://a', '00000000-0000-0000-0000-000000000001');
insert into tags (project_id, page_url, anchor, comment) values
  ('10000000-0000-0000-0000-000000000001', 'https://a/', '{}'::jsonb, 'hi');

-- Act as owner B; must see zero of A's tags.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002"}';
do $$
begin
  assert (select count(*) from tags) = 0, 'owner B must not see owner A tags';
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '\"')" -f supabase/tests/rls.sql
```
Expected: FAIL — without RLS, count is 1, assertion raises.

- [ ] **Step 3: Write RLS**

Create `supabase/migrations/0002_rls.sql`:
```sql
alter table projects enable row level security;
alter table tags enable row level security;

create policy projects_owner on projects
  for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

create policy tags_owner on tags
  for all to authenticated
  using (exists (select 1 from projects p
                 where p.id = tags.project_id and p.owner = auth.uid()))
  with check (exists (select 1 from projects p
                 where p.id = tags.project_id and p.owner = auth.uid()));

-- No grants to anon; access only via SECURITY DEFINER RPCs (Task 1.3).
revoke all on projects from anon;
revoke all on tags from anon;
```

- [ ] **Step 4: Run to verify it passes**

Run the same command as Step 2.
Expected: PASS — no assertion raised.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0002_rls.sql supabase/tests/rls.sql
git commit -m "feat(db): RLS scoping projects/tags to owner"
```

### Task 1.3: RPC functions for anonymous access

**Files:**
- Create: `supabase/migrations/0003_rpc.sql`
- Test: `supabase/tests/rpc.sql`

**Interfaces:**
- Consumes: tables from 1.1.
- Produces: `create_tag(p_project_key text, p_anchor jsonb, p_comment text, p_page_url text) returns uuid` and `get_tags(p_project_key text, p_page_url text) returns setof tags`. Both callable by `anon`. `create_tag` raises on unknown key.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/rpc.sql`:
```sql
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'a@x.com');
insert into projects (id, name, site_url, project_key, owner) values
  ('10000000-0000-0000-0000-000000000001', 'A', 'https://a', 'KEY123',
   '00000000-0000-0000-0000-000000000001');

set local role anon;
-- good key inserts and returns a uuid
do $$
declare new_id uuid;
begin
  new_id := create_tag('KEY123', '{"selector":"h1","text":null,"nthOfType":null}'::jsonb,
                       'looks off', 'https://a/');
  assert new_id is not null, 'create_tag should return id';
  assert (select count(*) from get_tags('KEY123', 'https://a/')) = 1, 'get_tags should see it';
end $$;
-- bad key raises
do $$
begin
  begin
    perform create_tag('NOPE', '{}'::jsonb, 'x', 'https://a/');
    assert false, 'bad key must raise';
  exception when others then null;
  end;
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '\"')" -f supabase/tests/rpc.sql
```
Expected: FAIL — `create_tag` function does not exist.

- [ ] **Step 3: Write the RPCs**

Create `supabase/migrations/0003_rpc.sql`:
```sql
create function create_tag(p_project_key text, p_anchor jsonb,
                           p_comment text, p_page_url text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_project uuid; v_id uuid;
begin
  select id into v_project from projects where project_key = p_project_key;
  if v_project is null then
    raise exception 'invalid project key';
  end if;
  insert into tags (project_id, page_url, anchor, comment)
  values (v_project, p_page_url, p_anchor, p_comment)
  returning id into v_id;
  return v_id;
end $$;

create function get_tags(p_project_key text, p_page_url text)
returns setof tags language plpgsql security definer set search_path = public as $$
begin
  return query
    select t.* from tags t
    join projects p on p.id = t.project_id
    where p.project_key = p_project_key and t.page_url = p_page_url;
end $$;

grant execute on function create_tag(text, jsonb, text, text) to anon;
grant execute on function get_tags(text, text) to anon;
```

- [ ] **Step 4: Run to verify it passes**

Run the same command as Step 2.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0003_rpc.sql supabase/tests/rpc.sql
git commit -m "feat(db): create_tag and get_tags RPCs for anon access"
```

---

## Phase 2 — Admin panel (Next.js)

### Task 2.1: Scaffold the panel and Supabase client

**Files:**
- Create: `panel/` (via create-next-app)
- Create: `panel/lib/supabase/server.ts`, `panel/lib/supabase/client.ts`
- Create: `panel/.env.local`

**Interfaces:**
- Produces: `createServerClient()` and `createBrowserClient()` helpers returning a typed Supabase client.

- [ ] **Step 1: Scaffold**

Run from repo root:
```bash
npx create-next-app@latest panel --ts --app --tailwind --eslint --src-dir=false --import-alias="@/*" --no-turbopack
cd panel && npm i @supabase/supabase-js @supabase/ssr && cd ..
```

- [ ] **Step 2: Env**

Create `panel/.env.local` (values from `supabase status`):
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `supabase status`>
```

- [ ] **Step 3: Supabase clients**

Create `panel/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

Create `panel/lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const store = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) =>
          store.set(name, value, options)),
      },
    }
  )
}
```

- [ ] **Step 4: Verify build**

Run: `cd panel && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add panel && git commit -m "feat(panel): scaffold Next.js app with Supabase clients"
```

### Task 2.2: Auth — login and protected layout

**Files:**
- Create: `panel/app/login/page.tsx`, `panel/app/login/actions.ts`
- Create: `panel/middleware.ts`
- Create: `panel/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `createClient` (server) from 2.1.
- Produces: routes under `app/(app)/` require a session; unauthenticated → `/login`.

- [ ] **Step 1: Login page + action**

Create `panel/app/login/actions.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  })
  if (error) return redirect('/login?error=1')
  redirect('/')
}
```

Create `panel/app/login/page.tsx`:
```tsx
import { signIn } from './actions'

export default function Login() {
  return (
    <form action={signIn} className="max-w-sm mx-auto mt-24 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">QA Panel — Sign in</h1>
      <input name="email" type="email" placeholder="Email" required className="border p-2 rounded" />
      <input name="password" type="password" placeholder="Password" required className="border p-2 rounded" />
      <button className="bg-black text-white p-2 rounded">Sign in</button>
    </form>
  )
}
```

- [ ] **Step 2: Middleware to protect routes**

Create `panel/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)),
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && req.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'] }
```

- [ ] **Step 3: App layout**

Create `panel/app/(app)/layout.tsx`:
```tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="max-w-4xl mx-auto p-6">{children}</div>
}
```

- [ ] **Step 4: Verify**

Run: `cd panel && npm run dev`, open `http://localhost:3000` → redirected to `/login`. Create a test user with `supabase` (SQL: `insert into auth.users ...` or Studio) and sign in → reach `/`.
Expected: redirect works; valid login lands on `/`.

- [ ] **Step 5: Commit**

```bash
git add panel/app/login panel/middleware.ts panel/app/\(app\)
git commit -m "feat(panel): email/password auth with route protection"
```

### Task 2.3: Data access layer (unit-tested)

**Files:**
- Create: `panel/lib/tags.ts`
- Test: `panel/lib/tags.test.ts`
- Modify: `panel/package.json` (add Vitest)

**Interfaces:**
- Produces:
  - `type Status = 'new' | 'in_progress' | 'resolved'`
  - `type Anchor = { selector: string; text: string | null; nthOfType: number | null }`
  - `nextStatuses(): Status[]` → `['new','in_progress','resolved']`
  - `isValidStatus(s: string): s is Status`

- [ ] **Step 1: Add Vitest**

Run: `cd panel && npm i -D vitest && cd ..`
Add to `panel/package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Write the failing test**

Create `panel/lib/tags.test.ts`:
```ts
import { expect, test } from 'vitest'
import { isValidStatus, nextStatuses } from './tags'

test('valid statuses', () => {
  expect(nextStatuses()).toEqual(['new', 'in_progress', 'resolved'])
  expect(isValidStatus('resolved')).toBe(true)
  expect(isValidStatus('done')).toBe(false)
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd panel && npm test`
Expected: FAIL — `./tags` has no such exports.

- [ ] **Step 4: Implement**

Create `panel/lib/tags.ts`:
```ts
export type Status = 'new' | 'in_progress' | 'resolved'
export type Anchor = { selector: string; text: string | null; nthOfType: number | null }
export type Tag = {
  id: string; project_id: string; page_url: string
  anchor: Anchor; comment: string; status: Status; created_at: string
}

const STATUSES: Status[] = ['new', 'in_progress', 'resolved']
export const nextStatuses = (): Status[] => [...STATUSES]
export const isValidStatus = (s: string): s is Status =>
  (STATUSES as string[]).includes(s)
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd panel && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add panel/lib/tags.ts panel/lib/tags.test.ts panel/package.json panel/package-lock.json
git commit -m "feat(panel): status/anchor types and helpers"
```

### Task 2.4: Projects list and creation

**Files:**
- Create: `panel/app/(app)/page.tsx`, `panel/app/(app)/actions.ts`

**Interfaces:**
- Consumes: server `createClient`, RLS from 1.2.
- Produces: `/` lists the admin's projects and creates one (name + site_url), showing the generated `project_key`.

- [ ] **Step 1: Create-project action**

Create `panel/app/(app)/actions.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('unauthenticated')
  await supabase.from('projects').insert({
    name: String(formData.get('name')),
    site_url: String(formData.get('site_url')),
    owner: user.id,
  })
  revalidatePath('/')
}
```

- [ ] **Step 2: Projects page**

Create `panel/app/(app)/page.tsx`:
```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createProject } from './actions'

export default async function Projects() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects').select('id, name, site_url, project_key')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <form action={createProject} className="flex gap-2">
        <input name="name" placeholder="Name" required className="border p-2 rounded" />
        <input name="site_url" placeholder="https://site.com" required className="border p-2 rounded" />
        <button className="bg-black text-white px-4 rounded">Add</button>
      </form>
      <ul className="flex flex-col gap-2">
        {projects?.map((p) => (
          <li key={p.id} className="border p-3 rounded flex justify-between">
            <Link href={`/projects/${p.id}`} className="font-medium underline">{p.name}</Link>
            <code className="text-sm text-gray-500">key: {p.project_key}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run dev server, sign in, add a project. Confirm it appears with a `project_key`, and that a second user cannot see it (RLS).
Expected: project created and listed; isolated per owner.

- [ ] **Step 4: Commit**

```bash
git add "panel/app/(app)/page.tsx" "panel/app/(app)/actions.ts"
git commit -m "feat(panel): list and create projects"
```

### Task 2.5: Tag list with status lifecycle

**Files:**
- Create: `panel/app/(app)/projects/[id]/page.tsx`
- Create: `panel/app/(app)/projects/[id]/StatusSelect.tsx`
- Modify: `panel/app/(app)/actions.ts` (add `setStatus`)

**Interfaces:**
- Consumes: `Tag`, `Status`, `isValidStatus`, `nextStatuses` from 2.3.
- Produces: per-project table of tags with a status dropdown that persists via `setStatus(tagId, status)`; a status filter.

- [ ] **Step 1: setStatus action**

Add to `panel/app/(app)/actions.ts`:
```ts
import { isValidStatus } from '@/lib/tags'

export async function setStatus(tagId: string, status: string) {
  if (!isValidStatus(status)) throw new Error('bad status')
  const supabase = await createClient()
  await supabase.from('tags').update({ status }).eq('id', tagId)
  revalidatePath('/projects', 'layout')
}
```

- [ ] **Step 2: Status dropdown (client component)**

Create `panel/app/(app)/projects/[id]/StatusSelect.tsx`:
```tsx
'use client'
import { nextStatuses, type Status } from '@/lib/tags'
import { setStatus } from '../../actions'

export function StatusSelect({ tagId, value }: { tagId: string; value: Status }) {
  return (
    <select defaultValue={value} onChange={(e) => setStatus(tagId, e.target.value)}
            className="border rounded p-1">
      {nextStatuses().map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}
```

- [ ] **Step 3: Project detail page**

Create `panel/app/(app)/projects/[id]/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { StatusSelect } from './StatusSelect'
import type { Tag } from '@/lib/tags'

export default async function ProjectDetail(
  { params, searchParams }:
  { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string }> }
) {
  const { id } = await params
  const { status } = await searchParams
  const supabase = await createClient()
  let q = supabase.from('tags').select('*').eq('project_id', id)
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data } = await q
  const tags = (data ?? []) as Tag[]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Tags</h1>
      <div className="flex gap-2 text-sm">
        <a href="?" className="underline">all</a>
        <a href="?status=new" className="underline">new</a>
        <a href="?status=in_progress" className="underline">in progress</a>
        <a href="?status=resolved" className="underline">resolved</a>
      </div>
      <table className="w-full text-left">
        <thead><tr className="border-b">
          <th className="p-2">Comment</th><th className="p-2">Page</th>
          <th className="p-2">Status</th></tr></thead>
        <tbody>
          {tags.map((t) => (
            <tr key={t.id} className="border-b align-top">
              <td className="p-2">{t.comment}</td>
              <td className="p-2 text-sm text-gray-500">{t.page_url}</td>
              <td className="p-2"><StatusSelect tagId={t.id} value={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Verify**

Seed a tag via the RPC (`psql ... select create_tag('<key>', '{}', 'test', 'https://a/')`), open the project, change its status, reload → status persisted. Filter links narrow the list.
Expected: status change persists; filter works.

- [ ] **Step 5: Commit**

```bash
git add "panel/app/(app)/projects" "panel/app/(app)/actions.ts"
git commit -m "feat(panel): tag list with status lifecycle and filter"
```

---

## Phase 3 — Chrome extension (MV3 + React)

### Task 3.1: Anchor module (unit-tested — the fragile core)

**Files:**
- Create: `extension/` scaffold (Vite + React + CRXJS)
- Create: `extension/src/anchor.ts`
- Test: `extension/src/anchor.test.ts`

**Interfaces:**
- Produces:
  - `type Anchor = { selector: string; text: string | null; nthOfType: number | null }`
  - `generateAnchor(el: Element): Anchor`
  - `findElement(anchor: Anchor, root?: ParentNode): Element | null` — tries `selector`; on miss, falls back to matching by tag + trimmed `text`.

- [ ] **Step 1: Scaffold extension**

Run from repo root:
```bash
npm create vite@latest extension -- --template react-ts
cd extension && npm i && npm i -D @crxjs/vite-plugin vitest jsdom && cd ..
```

- [ ] **Step 2: Write the failing test**

Create `extension/src/anchor.test.ts`:
```ts
// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { generateAnchor, findElement } from './anchor'

test('round-trips via selector', () => {
  document.body.innerHTML = `<main><section></section>
    <section><button class="cta">Add to cart</button></section></main>`
  const btn = document.querySelector('button')!
  const a = generateAnchor(btn)
  expect(findElement(a)).toBe(btn)
})

test('falls back to text when selector breaks', () => {
  document.body.innerHTML = `<div><button class="cta">Buy</button></div>`
  const a = generateAnchor(document.querySelector('button')!)
  // simulate rebuild: same text, different structure/classes
  document.body.innerHTML = `<section><button class="new">Buy</button></section>`
  expect(findElement(a)?.textContent).toBe('Buy')
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd extension && npx vitest run src/anchor.test.ts`
Expected: FAIL — `./anchor` not found.

- [ ] **Step 4: Implement**

Create `extension/src/anchor.ts`:
```ts
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
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd extension && npx vitest run src/anchor.test.ts`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
git add extension/src/anchor.ts extension/src/anchor.test.ts extension/package.json extension/package-lock.json
git commit -m "feat(ext): resilient element anchor generate/find"
```

### Task 3.2: Manifest, Supabase client, and popup for the project key

**Files:**
- Create: `extension/manifest.config.ts`
- Modify: `extension/vite.config.ts`
- Create: `extension/src/supabase.ts`
- Create: `extension/src/Popup.tsx`, `extension/index.html` (popup entry)
- Create: `extension/.env`

**Interfaces:**
- Consumes: none.
- Produces: `getKey(): Promise<string | null>`, `setKey(k: string): Promise<void>` over `chrome.storage.local`; `sb` Supabase client; MV3 manifest with a content script and popup.

- [ ] **Step 1: Manifest + Vite/CRXJS**

Create `extension/manifest.config.ts`:
```ts
import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'QA Tagger',
  version: '0.1.0',
  action: { default_popup: 'index.html' },
  permissions: ['storage', 'activeTab', 'scripting'],
  host_permissions: ['<all_urls>'],
  content_scripts: [{ matches: ['<all_urls>'], js: ['src/content.tsx'] }],
})
```

Replace `extension/vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({ plugins: [react(), crx({ manifest })] })
```

- [ ] **Step 2: Env + Supabase client**

Create `extension/.env`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`>
```

Create `extension/src/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const getKey = async (): Promise<string | null> =>
  (await chrome.storage.local.get('projectKey')).projectKey ?? null
export const setKey = async (k: string): Promise<void> =>
  chrome.storage.local.set({ projectKey: k })
```

Run: `cd extension && npm i @supabase/supabase-js && cd ..`

- [ ] **Step 3: Popup**

Create `extension/src/Popup.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { getKey, setKey } from './supabase'

export function Popup() {
  const [key, setLocal] = useState('')
  useEffect(() => { getKey().then((k) => k && setLocal(k)) }, [])
  return (
    <div style={{ width: 260, padding: 12, fontFamily: 'sans-serif' }}>
      <h3>QA Tagger</h3>
      <input value={key} onChange={(e) => setLocal(e.target.value)}
             placeholder="Project key" style={{ width: '100%' }} />
      <button onClick={() => setKey(key)} style={{ marginTop: 8 }}>Save</button>
    </div>
  )
}
```

Replace `extension/src/main.tsx` to mount `Popup`, and set `extension/index.html` title to "QA Tagger". (create-vite gives `main.tsx` + `index.html`; point the render at `Popup`.)

- [ ] **Step 4: Verify build + load**

Run: `cd extension && npm run build`. Then Chrome → Extensions → Load unpacked → `extension/dist`. Open popup, save a key, reopen popup → key persists.
Expected: build succeeds; key persists across popup opens.

- [ ] **Step 5: Commit**

```bash
git add extension/manifest.config.ts extension/vite.config.ts extension/src/supabase.ts extension/src/Popup.tsx extension/src/main.tsx extension/index.html extension/package.json
git commit -m "feat(ext): manifest, supabase client, project-key popup"
```

### Task 3.3: Content script — create tags and render pins

**Files:**
- Create: `extension/src/content.tsx`
- Create: `extension/src/overlay.css`

**Interfaces:**
- Consumes: `generateAnchor`, `findElement` (3.1); `sb`, `getKey` (3.2); RPCs `create_tag`, `get_tags` (1.3).
- Produces: an in-page toolbar with a "Tag mode" toggle; click-to-comment creates a tag; existing tags for the page render as pins; unfound tags list in a small panel.

- [ ] **Step 1: Content script**

Create `extension/src/content.tsx`:
```tsx
import { generateAnchor, findElement, type Anchor } from './anchor'
import { sb, getKey } from './supabase'
import './overlay.css'

type Row = { id: string; anchor: Anchor; comment: string }

async function loadPins() {
  const key = await getKey()
  if (!key) return
  const { data } = await sb.rpc('get_tags', {
    p_project_key: key, p_page_url: location.href,
  })
  const rows = (data ?? []) as Row[]
  const unfound: Row[] = []
  for (const r of rows) {
    const el = findElement(r.anchor)
    if (!el) { unfound.push(r); continue }
    const rect = el.getBoundingClientRect()
    const pin = document.createElement('div')
    pin.className = 'qa-pin'
    pin.title = r.comment
    pin.style.top = `${rect.top + window.scrollY}px`
    pin.style.left = `${rect.left + window.scrollX}px`
    document.body.appendChild(pin)
  }
  if (unfound.length) console.info('[QA] unanchored tags:', unfound)
}

function enableTagMode() {
  const onClick = async (e: MouseEvent) => {
    if ((e.target as Element).classList?.contains('qa-toolbar-btn')) return
    e.preventDefault(); e.stopPropagation()
    const el = e.target as Element
    const comment = prompt('Comment for this element:')  // ponytail: native prompt, replace with inline box if UX demands
    if (comment) {
      const key = await getKey()
      await sb.rpc('create_tag', {
        p_project_key: key, p_anchor: generateAnchor(el),
        p_comment: comment, p_page_url: location.href,
      })
      location.reload()
    }
    document.removeEventListener('click', onClick, true)
  }
  document.addEventListener('click', onClick, true)
}

const toolbar = document.createElement('div')
toolbar.className = 'qa-toolbar'
const btn = document.createElement('button')
btn.className = 'qa-toolbar-btn'
btn.textContent = 'Tag mode'
btn.onclick = enableTagMode
toolbar.appendChild(btn)
document.body.appendChild(toolbar)
loadPins()
```

- [ ] **Step 2: Overlay styles**

Create `extension/src/overlay.css`:
```css
.qa-toolbar { position: fixed; bottom: 16px; right: 16px; z-index: 2147483647; }
.qa-toolbar-btn { background: #111; color: #fff; border: 0; padding: 8px 12px;
  border-radius: 6px; cursor: pointer; font: 13px sans-serif; }
.qa-pin { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px;
  background: #e11; border: 2px solid #fff; border-radius: 50%;
  z-index: 2147483646; pointer-events: none; }
```

Note: `prompt()` is a page dialog — acceptable here because the content script runs in the page, but per project guidance avoid triggering it during automated browser testing. Manual test only.

- [ ] **Step 3: Verify end to end**

With `supabase start`, panel running, and a project key saved: open any page in the project's site, click "Tag mode", click an element, enter a comment. Reload → a red pin appears at that element. Confirm the tag shows in the panel and its status can be changed.
Expected: tag created via RPC, pin renders on reload, visible in panel.

- [ ] **Step 4: Commit**

```bash
git add extension/src/content.tsx extension/src/overlay.css
git commit -m "feat(ext): content script for tagging and pin rendering"
```

---

## Self-review notes

- **Spec coverage:** capture=anchor+comment (3.1, 3.3); anonymous project-key access (1.3, 3.2); existing tags as pins (3.3); admin login (2.2); projects (2.4); status lifecycle + list + filter (2.5); RLS isolation (1.2); unanchored fallback (3.1 `findElement` miss → 3.3 console list). All covered.
- **Deferred (per spec):** screenshots, metadata, threads, assignment, client accounts, status-in-extension, rate limiting — none appear as tasks. Correct.
- **Type consistency:** `Anchor` shape identical across `panel/lib/tags.ts`, `extension/src/anchor.ts`, DB jsonb. Statuses identical everywhere. RPC param names (`p_project_key`, `p_anchor`, `p_comment`, `p_page_url`) match between 1.3 and 3.3.
