# ClientPin Onboarding + Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add owner accounts (Google), an onboarding wizard that creates a project and returns a shareable password-gated link + connect code, a project dashboard (progress %, milestones, QA), and simplify the extension to a connect-code detector.

**Architecture:** Supabase Auth (Google) for owners with RLS; the public `/[slug]` dashboard is gated by a per-project password (a view token in an httpOnly cookie, checked by a SECURITY DEFINER RPC); the extension stays anonymous and tags via the existing RPCs using the connect code (`project_key`).

**Tech Stack:** Supabase (Postgres, pgcrypto, Auth/Google), Next.js 16 App Router + `@supabase/ssr` (reintroduced for auth) + `@supabase/supabase-js` (anon), Vite + React MV3 extension, Vitest.

## Global Constraints

- Milestone status is exactly `waiting` | `in_progress` | `done`. Tag status stays `new` | `in_progress` | `resolved`.
- `projects` columns after this work: `id, slug (unique), project_key (unique), owner (→auth.users), name, description, github_link, site_url, milestones jsonb, view_password_hash, view_token, created_at, updated_at`. No `last_active_at`, no purge cron.
- Owner RLS: `projects for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid())`; `anon` has no direct table access.
- Password hashing uses pgcrypto (`crypt`, `gen_salt('bf')`) which lives in the `extensions` schema, so any RPC that calls them must be `security definer set search_path = public, extensions`.
- RPC signatures (fixed):
  - `create_project(p_name text, p_description text, p_github_link text, p_site_url text, p_milestones jsonb, p_view_password text) returns table(slug text, project_key text)` — granted to `authenticated`.
  - `update_project(p_slug text, p_name text, p_description text, p_github_link text, p_site_url text, p_milestones jsonb) returns void` — granted to `authenticated`.
  - `verify_view_password(p_slug text, p_password text) returns text` — granted to `anon` (returns `view_token` or NULL).
  - `get_dashboard(p_slug text, p_token text) returns jsonb` — granted to `anon` (`{project, tags}` or NULL).
  - `connect_project(p_project_key text) returns table(name text, slug text)` — granted to `anon`.
  - Kept from the pivot: `create_tag`, `get_tags`, `get_tag`, `set_status`.
- `slug` = `gen_token(10)`, `view_token` = `gen_token(24)`, `project_key` = `replace(gen_random_uuid()::text,'-','')`.
- App base URL for links comes from `NEXT_PUBLIC_APP_URL` (dev `http://localhost:3000`).
- Dashboard uses ClientPin blue (existing Material tokens in `panel/app/globals.css`), laid out like the reference screenshot.

---

## Phase 1 — Database

### Task 1.1: Schema migration (owner, project fields, milestones, password; drop expiry)

**Files:**
- Create: `supabase/migrations/0008_onboarding_schema.sql`
- Test: `supabase/tests/onboarding_schema.sql`

**Interfaces:**
- Consumes: pivot schema + `gen_token(len)`.
- Produces: the `projects` columns from Global Constraints; owner RLS; the `purge_expired` cron/function removed.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/onboarding_schema.sql`:
```sql
do $$
begin
  perform 1 from information_schema.columns where table_name='projects' and column_name='owner';
  assert found, 'projects.owner missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='milestones';
  assert found, 'projects.milestones missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='view_password_hash';
  assert found, 'projects.view_password_hash missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='view_token';
  assert found, 'projects.view_token missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='last_active_at';
  assert not found, 'last_active_at should be dropped';
  perform 1 from pg_proc where proname='purge_expired';
  assert not found, 'purge_expired should be dropped';
  perform 1 from pg_policies where tablename='projects' and policyname='projects_owner';
  assert found, 'owner RLS policy missing';
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -f supabase/tests/onboarding_schema.sql
```
Expected: FAIL — `projects.owner` missing.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/0008_onboarding_schema.sql`:
```sql
-- Remove the 7-day expiry machinery (owned projects persist)
select cron.unschedule('purge_expired') where exists (select 1 from cron.job where jobname='purge_expired');
drop function if exists purge_expired();
alter table projects drop column if exists last_active_at;

-- New project fields
alter table projects add column if not exists owner uuid references auth.users(id) on delete cascade;
alter table projects add column if not exists description text;
alter table projects add column if not exists github_link text;
alter table projects add column if not exists site_url_opt text; -- site_url already exists from pivot; keep it, this line is a no-op guard removed below
alter table projects drop column if exists site_url_opt;
alter table projects add column if not exists milestones jsonb not null default '[]'::jsonb;
alter table projects add column if not exists view_password_hash text;
alter table projects add column if not exists view_token text;
alter table projects add column if not exists updated_at timestamptz not null default now();

-- Owner RLS (tables otherwise RPC-only)
drop policy if exists projects_owner on projects;
create policy projects_owner on projects
  for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
```

- [ ] **Step 4: Run to verify it passes**

Run the Step 2 commands again.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0008_onboarding_schema.sql supabase/tests/onboarding_schema.sql
git commit -m "feat(db): onboarding schema — owner, milestones, view password; drop expiry"
```

### Task 1.2: Owner project RPCs (create_project, update_project)

**Files:**
- Create: `supabase/migrations/0009_owner_rpc.sql`
- Test: `supabase/tests/owner_rpc.sql`

**Interfaces:**
- Consumes: Task 1.1 schema, `gen_token`.
- Produces: `create_project(...)` and `update_project(...)` per Global Constraints. Drops the pivot's anon `create_project(text,text)`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/owner_rpc.sql`:
```sql
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001','o@x.com');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001"}';
do $$
declare v_slug text; v_key text;
begin
  select slug, project_key into v_slug, v_key from create_project(
    'Acme', 'A store', 'https://github.com/x/y', 'https://acme.store',
    '[{"name":"Design","status":"done"},{"name":"Build","status":"in_progress"}]'::jsonb, 'secret1');
  assert v_slug is not null and v_key is not null, 'create_project returns slug+key';
  perform 1 from projects where slug=v_slug and owner='00000000-0000-0000-0000-000000000001'
    and description='A store' and jsonb_array_length(milestones)=2
    and view_password_hash is not null and view_token is not null;
  assert found, 'project row populated with owner+fields';

  perform update_project(v_slug, 'Acme 2', 'B', null, null,
    '[{"name":"Design","status":"done"}]'::jsonb);
  perform 1 from projects where slug=v_slug and name='Acme 2' and jsonb_array_length(milestones)=1;
  assert found, 'update_project applied';
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -f supabase/tests/owner_rpc.sql
```
Expected: FAIL — `create_project(...)` (6-arg) does not exist.

- [ ] **Step 3: Write the RPCs**

Create `supabase/migrations/0009_owner_rpc.sql`:
```sql
-- Drop the pivot's anon create_project (2-arg) and get_list; replaced here / in 0010.
drop function if exists create_project(text, text);

create function create_project(p_name text, p_description text, p_github_link text,
                               p_site_url text, p_milestones jsonb, p_view_password text)
returns table(slug text, project_key text)
language plpgsql security definer set search_path = public, extensions as $$
declare v_slug text; v_key text; v_owner uuid;
begin
  v_owner := auth.uid();
  if v_owner is null then raise exception 'not authenticated'; end if;
  v_slug := gen_token(10);
  v_key  := replace(gen_random_uuid()::text, '-', '');
  insert into projects (name, description, github_link, site_url, milestones, owner,
                        slug, project_key, view_token, view_password_hash)
  values (p_name, p_description, p_github_link, p_site_url, coalesce(p_milestones,'[]'::jsonb), v_owner,
          v_slug, v_key, gen_token(24), crypt(p_view_password, gen_salt('bf')));
  slug := v_slug; project_key := v_key; return next;
end $$;

create function update_project(p_slug text, p_name text, p_description text,
                               p_github_link text, p_site_url text, p_milestones jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update projects set name = p_name, description = p_description, github_link = p_github_link,
    site_url = p_site_url, milestones = coalesce(p_milestones,'[]'::jsonb), updated_at = now()
  where slug = p_slug and owner = auth.uid();
  if not found then raise exception 'not found or not owner'; end if;
end $$;

grant execute on function create_project(text,text,text,text,jsonb,text) to authenticated;
grant execute on function update_project(text,text,text,text,text,jsonb) to authenticated;
```

- [ ] **Step 4: Run to verify it passes**

Run the Step 2 commands again.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0009_owner_rpc.sql supabase/tests/owner_rpc.sql
git commit -m "feat(db): authenticated create_project + update_project"
```

### Task 1.3: Viewer + extension RPCs (verify_view_password, get_dashboard, connect_project)

**Files:**
- Create: `supabase/migrations/0010_view_rpc.sql`
- Test: `supabase/tests/view_rpc.sql`

**Interfaces:**
- Consumes: Task 1.2.
- Produces: `verify_view_password`, `get_dashboard`, `connect_project` per Global Constraints; drops the pivot `get_list(text)`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/view_rpc.sql`:
```sql
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001','o@x.com');
-- create a project as the owner
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000001"}';
do $$
declare v_slug text; v_key text; v_tok text; v_dash jsonb;
begin
  select slug, project_key into v_slug, v_key from create_project('Acme','d',null,'https://acme.store','[]'::jsonb,'secret1');

  reset role;  -- act as the anon/definer path for viewer RPCs
  v_tok := verify_view_password(v_slug, 'wrong');
  assert v_tok is null, 'wrong password -> null';
  v_tok := verify_view_password(v_slug, 'secret1');
  assert v_tok is not null, 'right password -> token';

  v_dash := get_dashboard(v_slug, v_tok);
  assert v_dash->'project'->>'name' = 'Acme', 'get_dashboard returns project';
  assert v_dash ? 'tags', 'get_dashboard has tags array';
  assert get_dashboard(v_slug, 'badtoken') is null, 'bad token -> null';

  perform 1 from connect_project(v_key) where slug = v_slug;
  assert found, 'connect_project returns slug for the key';
end $$;
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
supabase db reset
psql "$(supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')" -f supabase/tests/view_rpc.sql
```
Expected: FAIL — `verify_view_password` does not exist.

- [ ] **Step 3: Write the RPCs**

Create `supabase/migrations/0010_view_rpc.sql`:
```sql
drop function if exists get_list(text);

create function verify_view_password(p_slug text, p_password text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_token text;
begin
  select view_password_hash, view_token into v_hash, v_token from projects where slug = p_slug;
  if v_hash is null then return null; end if;
  if crypt(p_password, v_hash) = v_hash then return v_token; end if;
  return null;
end $$;

create function get_dashboard(p_slug text, p_token text)
returns jsonb language sql security definer set search_path = public stable as $$
  select case when p.id is null then null else jsonb_build_object(
    'project', jsonb_build_object(
      'name', p.name, 'description', p.description, 'github_link', p.github_link,
      'site_url', p.site_url, 'slug', p.slug, 'milestones', p.milestones,
      'created_at', p.created_at),
    'tags', coalesce((select jsonb_agg(jsonb_build_object(
        'id', t.id, 'page_url', t.page_url, 'anchor', t.anchor, 'comment', t.comment,
        'status', t.status, 'screenshot_path', t.screenshot_path, 'created_at', t.created_at
      ) order by t.created_at desc) from tags t where t.project_id = p.id), '[]'::jsonb)
  ) end
  from projects p where p.slug = p_slug and p.view_token = p_token;
$$;

create function connect_project(p_project_key text)
returns table(name text, slug text)
language sql security definer set search_path = public stable as $$
  select name, slug from projects where project_key = p_project_key;
$$;

grant execute on function verify_view_password(text,text) to anon;
grant execute on function get_dashboard(text,text)        to anon;
grant execute on function connect_project(text)           to anon;
```

- [ ] **Step 4: Run to verify it passes**

Run the Step 2 commands again.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0010_view_rpc.sql supabase/tests/view_rpc.sql
git commit -m "feat(db): verify_view_password, get_dashboard, connect_project"
```

---

## Phase 2 — Web auth + onboarding

### Task 2.1: Reintroduce @supabase/ssr clients + protect /onboarding

**Files:**
- Create: `panel/lib/supabase/server.ts`, `panel/lib/supabase/client.ts`
- Create: `panel/proxy.ts`
- Modify: `panel/package.json` (add `@supabase/ssr`)

**Interfaces:**
- Consumes: none.
- Produces: `createClient()` (server, cookie-aware) and `createBrowserClient()` (browser); `/onboarding` requires a session.

- [ ] **Step 1: Install `@supabase/ssr`**

Run: `cd panel && npm i @supabase/ssr && cd ..`

- [ ] **Step 2: Server + browser clients**

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
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => store.set(name, value, options)) } catch {}
        },
      },
    }
  )
}
```

Create `panel/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
```

- [ ] **Step 3: Route protection**

Create `panel/proxy.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && req.nextUrl.pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}

export const config = { matcher: ['/onboarding/:path*'] }
```

- [ ] **Step 4: Verify build**

Run: `cd panel && npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add panel/lib/supabase/server.ts panel/lib/supabase/client.ts panel/proxy.ts panel/package.json panel/package-lock.json
git commit -m "feat(web): reintroduce @supabase/ssr clients + protect /onboarding"
```

### Task 2.2: Google login + auth callback

**Files:**
- Create: `panel/app/login/page.tsx`, `panel/app/login/actions.ts`
- Create: `panel/app/auth/callback/route.ts`

**Interfaces:**
- Consumes: server + browser clients (2.1).
- Produces: `/login` (Google button) and `/auth/callback` (exchanges the OAuth code, redirects to `/onboarding`).

- [ ] **Step 1: Sign-in action (server)**

Create `panel/app/login/actions.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  })
  if (error) redirect('/login?error=1')
  if (data.url) redirect(data.url)
}
```

- [ ] **Step 2: Login page**

Create `panel/app/login/page.tsx`:
```tsx
import { signInWithGoogle } from './actions'

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-ink shadow-bar">
          <span className="text-[1.2rem] font-bold">C</span>
        </span>
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-ink">Sign in to ClientPin</h1>
        <p className="mt-1 text-[0.875rem] text-ink-dim">Create and manage your projects.</p>
        {error && <p className="mt-3 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>Sign-in failed. Try again.</p>}
        <form action={signInWithGoogle} className="mt-6">
          <button className="ring-accent w-full rounded-lg border border-line bg-surface px-4 py-3 text-[0.9375rem] font-medium text-ink shadow-bar transition-colors hover:bg-surface-2">
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Callback route**

Create `panel/app/auth/callback/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/onboarding`)
}
```

- [ ] **Step 4: Verify build**

Run: `cd panel && npm run build`
Expected: build succeeds; `/login` and `/auth/callback` compile.

- [ ] **Step 5: Commit**

```bash
git add panel/app/login panel/app/auth
git commit -m "feat(web): Google sign-in and auth callback"
```

### Task 2.3: Onboarding wizard → create project → success screen

**Files:**
- Create: `panel/app/onboarding/page.tsx`, `panel/app/onboarding/OnboardingForm.tsx`, `panel/app/onboarding/actions.ts`
- Create: `panel/app/onboarding/CopyField.tsx`

**Interfaces:**
- Consumes: server client (2.1); `create_project` RPC (1.2); `NEXT_PUBLIC_APP_URL`.
- Produces: an onboarding form; on submit creates the project and shows the public link + connect code.

- [ ] **Step 1: Create-project action**

Create `panel/app/onboarding/actions.ts`:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'

export type Milestone = { name: string; status: 'waiting' | 'in_progress' | 'done' }

export async function createProject(input: {
  name: string; description: string; github_link: string; site_url: string
  milestones: Milestone[]; view_password: string
}): Promise<{ slug: string; project_key: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_project', {
    p_name: input.name, p_description: input.description,
    p_github_link: input.github_link || null, p_site_url: input.site_url || null,
    p_milestones: input.milestones, p_view_password: input.view_password,
  })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return row as { slug: string; project_key: string }
}
```

- [ ] **Step 2: Copy field (client)**

Create `panel/app/onboarding/CopyField.tsx`:
```tsx
'use client'
import { useState } from 'react'
export function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false)
  return (
    <div>
      <span className="text-[0.75rem] font-medium text-ink-dim">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-surface p-2">
        <code className="mono flex-1 truncate px-1 text-[0.8125rem] text-ink">{value}</code>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200) }}
          className="ring-accent rounded-md bg-accent px-3 py-1 text-[0.75rem] font-medium text-accent-ink">{done ? 'Copied' : 'Copy'}</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Onboarding form (client)**

Create `panel/app/onboarding/OnboardingForm.tsx`:
```tsx
'use client'
import { useState, useTransition } from 'react'
import { createProject, type Milestone } from './actions'
import { CopyField } from './CopyField'

const field = 'ring-accent w-full rounded-lg border border-line bg-surface px-3 py-2 text-[0.875rem] focus:border-accent focus:outline-none'

export function OnboardingForm({ appUrl }: { appUrl: string }) {
  const [name, setName] = useState(''); const [desc, setDesc] = useState('')
  const [github, setGithub] = useState(''); const [site, setSite] = useState(''); const [pw, setPw] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>([{ name: '', status: 'waiting' }])
  const [pending, start] = useTransition()
  const [result, setResult] = useState<{ slug: string; project_key: string } | null>(null)
  const [err, setErr] = useState('')

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <div><h2 className="text-[1.25rem] font-semibold text-ink">Project created</h2>
          <p className="mt-1 text-[0.875rem] text-ink-dim">Share the link (with the password) and give the connect code to whoever installs the extension.</p></div>
        <CopyField label="Public link" value={`${appUrl}/${result.slug}`} />
        <CopyField label="Connect code (for the extension)" value={result.project_key} />
      </div>
    )
  }

  const submit = () => {
    setErr('')
    if (!name.trim() || !pw.trim()) { setErr('Name and password are required.'); return }
    const ms = milestones.filter((m) => m.name.trim())
    start(async () => {
      try { setResult(await createProject({ name: name.trim(), description: desc.trim(), github_link: github.trim(), site_url: site.trim(), milestones: ms, view_password: pw })) }
      catch (e) { setErr((e as Error).message) }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1"><span className="text-[0.75rem] font-medium text-ink-dim">Project name *</span>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Store" /></label>
      <label className="flex flex-col gap-1"><span className="text-[0.75rem] font-medium text-ink-dim">Description</span>
        <textarea className={field} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this project?" /></label>

      <div>
        <span className="text-[0.75rem] font-medium text-ink-dim">Milestones (optional)</span>
        <div className="mt-1 flex flex-col gap-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input className={field} value={m.name} placeholder={`Milestone ${i + 1}`}
                onChange={(e) => setMilestones(milestones.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
              <select className="ring-accent rounded-lg border border-line bg-surface px-2 text-[0.8125rem]" value={m.status}
                onChange={(e) => setMilestones(milestones.map((x, j) => j === i ? { ...x, status: e.target.value as Milestone['status'] } : x))}>
                <option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="done">Done</option>
              </select>
              <button type="button" className="px-2 text-ink-mute hover:text-ink" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button type="button" className="w-fit text-[0.8125rem] font-medium text-accent" onClick={() => setMilestones([...milestones, { name: '', status: 'waiting' }])}>+ Add milestone</button>
        </div>
      </div>

      <label className="flex flex-col gap-1"><span className="text-[0.75rem] font-medium text-ink-dim">GitHub link (optional)</span>
        <input className={field} value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." /></label>
      <label className="flex flex-col gap-1"><span className="text-[0.75rem] font-medium text-ink-dim">Site URL (optional)</span>
        <input className={field} value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://acme.store" /></label>
      <label className="flex flex-col gap-1"><span className="text-[0.75rem] font-medium text-ink-dim">View password *</span>
        <input className={field} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Clients enter this to view the link" /></label>

      {err && <p className="text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>{err}</p>}
      <button onClick={submit} disabled={pending}
        className="ring-accent rounded-lg bg-accent px-5 py-2.5 text-[0.9375rem] font-semibold text-accent-ink shadow-bar disabled:opacity-60">
        {pending ? 'Creating…' : 'Create project'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Onboarding page**

Create `panel/app/onboarding/page.tsx`:
```tsx
import { OnboardingForm } from './OnboardingForm'

export default function Onboarding() {
  return (
    <main className="mx-auto max-w-lg px-6 py-14">
      <h1 className="text-[1.5rem] font-semibold tracking-tight text-ink">Create your first project</h1>
      <p className="mt-1 text-[0.9375rem] text-ink-dim">You'll get a shareable link and a connect code for the extension.</p>
      <div className="mt-8"><OnboardingForm appUrl={process.env.NEXT_PUBLIC_APP_URL!} /></div>
    </main>
  )
}
```

- [ ] **Step 5: Verify**

Run: `cd panel && npm run build`. With a signed-in session you'd reach `/onboarding`; without one, `proxy.ts` redirects to `/login`. Build must pass.
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add panel/app/onboarding
git commit -m "feat(web): onboarding wizard, create project, success screen"
```

### Task 2.4: Landing "Try now" CTA → /login

**Files:**
- Modify: `panel/app/page.tsx` (hero + nav + final CTA link targets)

**Interfaces:**
- Consumes: `/login`.
- Produces: the landing's primary CTA points at `/login`.

- [ ] **Step 1: Point the primary CTAs at /login**

In `panel/app/page.tsx`, change the hero's primary button and the nav "Install" button to a "Try now" link to `/login`. Replace the hero primary button:
```tsx
<a href="/login" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-[0.9375rem] font-semibold text-accent-ink shadow-bar transition-colors hover:bg-accent-press">Try now, it's free</a>
```
And in `panel/app/_landing/Nav.tsx` change the "Install" link `href="#install"` to `href="/login"` with text `Try now`. Keep the install section's Download button (the Drive link) for clients.

- [ ] **Step 2: Verify build**

Run: `cd panel && npm run build`
Expected: build succeeds; the landing shows "Try now" → `/login`.

- [ ] **Step 3: Commit**

```bash
git add panel/app/page.tsx panel/app/_landing/Nav.tsx
git commit -m "feat(web): landing Try now CTA to sign-in"
```

---

## Phase 3 — Project dashboard

### Task 3.1: Progress helper + password gate + dashboard data

**Files:**
- Create: `panel/lib/dashboard.ts`
- Test: `panel/lib/dashboard.test.ts`
- Create: `panel/app/[slug]/PasswordGate.tsx`
- Modify: `panel/app/[slug]/page.tsx` (rewrite), `panel/app/actions.ts` (add `verifyPassword`)

**Interfaces:**
- Consumes: `sb` (anon), `createClient` (server, auth); RPCs `verify_view_password`, `get_dashboard`; owner reads `projects` via RLS.
- Produces:
  - `type Milestone = { name: string; status: 'waiting'|'in_progress'|'done' }`
  - `type Dashboard = { project: {...}; tags: Tag[] }`
  - `progressPct(ms: Milestone[]): number`
  - `verifyPassword(slug, password)` server action (sets the `pv-<slug>` cookie).

- [ ] **Step 1: Write the failing test**

Create `panel/lib/dashboard.test.ts`:
```ts
import { expect, test } from 'vitest'
import { progressPct } from './dashboard'

test('progress is done/total rounded, 0 when empty', () => {
  expect(progressPct([])).toBe(0)
  expect(progressPct([{ name: 'a', status: 'done' }, { name: 'b', status: 'waiting' }])).toBe(50)
  expect(progressPct([{ name: 'a', status: 'done' }, { name: 'b', status: 'done' }, { name: 'c', status: 'in_progress' }])).toBe(67)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd panel && npm test`
Expected: FAIL — `./dashboard` has no `progressPct`.

- [ ] **Step 3: Implement the helper + types**

Create `panel/lib/dashboard.ts`:
```ts
import type { Tag } from './types'

export type Milestone = { name: string; status: 'waiting' | 'in_progress' | 'done' }
export type DashboardProject = {
  name: string; description: string | null; github_link: string | null
  site_url: string | null; slug: string; milestones: Milestone[]; created_at: string
}
export type Dashboard = { project: DashboardProject; tags: Tag[] }

export function progressPct(ms: Milestone[]): number {
  if (!ms.length) return 0
  return Math.round((ms.filter((m) => m.status === 'done').length / ms.length) * 100)
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd panel && npm test`
Expected: PASS.

- [ ] **Step 5: verifyPassword action**

Add to `panel/app/actions.ts`:
```ts
import { cookies } from 'next/headers'

export async function verifyPassword(slug: string, password: string): Promise<boolean> {
  const { data, error } = await sb.rpc('verify_view_password', { p_slug: slug, p_password: password })
  if (error || !data) return false
  ;(await cookies()).set(`pv-${slug}`, data as string, { httpOnly: true, sameSite: 'lax', path: `/${slug}` })
  revalidatePath(`/${slug}`)
  return true
}
```
(`sb` and `revalidatePath` are already imported in `actions.ts`; add the `cookies` import.)

- [ ] **Step 6: PasswordGate (client)**

Create `panel/app/[slug]/PasswordGate.tsx`:
```tsx
'use client'
import { useState, useTransition } from 'react'
import { verifyPassword } from '../actions'

export function PasswordGate({ slug }: { slug: string }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(false); const [pending, start] = useTransition()
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <form className="w-full max-w-sm text-center"
        onSubmit={(e) => { e.preventDefault(); start(async () => { const ok = await verifyPassword(slug, pw); if (!ok) setErr(true) }) }}>
        <span className="mx-auto mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-ink shadow-bar text-[1.1rem] font-bold">C</span>
        <h1 className="text-[1.25rem] font-semibold text-ink">This project is protected</h1>
        <p className="mt-1 text-[0.875rem] text-ink-dim">Enter the password to view it.</p>
        <input type="password" autoFocus value={pw} onChange={(e) => { setPw(e.target.value); setErr(false) }}
          className="ring-accent mt-5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-center text-[0.9375rem] focus:border-accent focus:outline-none" placeholder="Password" />
        {err && <p className="mt-2 text-[0.8125rem]" style={{ color: 'var(--color-danger)' }}>Incorrect password.</p>}
        <button disabled={pending} className="ring-accent mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-[0.9375rem] font-semibold text-accent-ink shadow-bar disabled:opacity-60">
          {pending ? 'Checking…' : 'View project'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add panel/lib/dashboard.ts panel/lib/dashboard.test.ts "panel/app/[slug]/PasswordGate.tsx" panel/app/actions.ts
git commit -m "feat(web): progress helper, password gate, verify action"
```

### Task 3.2: Dashboard page (owner vs viewer) + Basic info + QA

**Files:**
- Modify: `panel/app/[slug]/page.tsx` (full rewrite)
- Create: `panel/app/[slug]/Sidebar.tsx`, `panel/app/[slug]/Milestones.tsx`
- Reuse: `panel/app/[slug]/StatusSelect.tsx`, `panel/app/[slug]/CopyButton.tsx`, `panel/lib/prompt.ts`, `panel/lib/supabase.ts` (`screenshotUrl`)

**Interfaces:**
- Consumes: `Dashboard`, `progressPct`, `Milestone` (3.1); `verify_view_password`/`get_dashboard`; server auth client + owner RLS read; `buildPrompt`/`buildBulkPrompt`; `screenshotUrl`.
- Produces: the rendered dashboard.

- [ ] **Step 1: Sidebar**

Create `panel/app/[slug]/Sidebar.tsx`:
```tsx
const TABS = [
  { key: 'basic', label: 'Basic info', live: true },
  { key: 'board', label: 'Dev board', live: false },
  { key: 'confirm', label: 'Confirm', live: false },
  { key: 'qa', label: 'QA', live: true },
  { key: 'docs', label: 'Docs', live: false },
]
export function Sidebar({ active }: { active: string }) {
  return (
    <nav className="flex shrink-0 flex-col gap-1 md:w-52">
      <p className="px-3 pb-2 text-[0.6875rem] font-medium uppercase tracking-wide text-ink-mute">Client view</p>
      {TABS.map((t) => (
        <a key={t.key} href={t.live ? `#${t.key}` : undefined}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-[0.875rem] ${active === t.key ? 'bg-accent-soft font-medium text-accent' : t.live ? 'text-ink-dim hover:bg-surface-2' : 'cursor-default text-ink-mute'}`}>
          {t.label}{!t.live && <span className="text-[0.6875rem]">soon</span>}
        </a>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Milestones tracker**

Create `panel/app/[slug]/Milestones.tsx`:
```tsx
import type { Milestone } from '@/lib/dashboard'
const STEPS = ['waiting', 'in_progress', 'done'] as const
const LABEL = { waiting: 'Waiting', in_progress: 'In progress', done: 'Done' }
export function Milestones({ milestones }: { milestones: Milestone[] }) {
  if (!milestones.length) return <p className="text-[0.875rem] text-ink-mute">No milestones yet.</p>
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {milestones.map((m, i) => {
        const idx = STEPS.indexOf(m.status)
        return (
          <div key={i} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[0.9375rem] font-semibold text-ink">{m.name}</span>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.6875rem] font-medium text-accent">{LABEL[m.status]}</span>
            </div>
            <div className="mt-3 flex items-center">
              {STEPS.map((s, si) => (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[0.7rem] font-semibold ${si <= idx ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink-mute'}`}>{si < idx ? '✓' : si + 1}</span>
                  {si < STEPS.length - 1 && <span className={`h-0.5 flex-1 ${si < idx ? 'bg-accent' : 'bg-line'}`} />}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Dashboard page**

Rewrite `panel/app/[slug]/page.tsx`:
```tsx
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { sb, screenshotUrl } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/server'
import { progressPct, type Dashboard } from '@/lib/dashboard'
import { buildPrompt, buildBulkPrompt } from '@/lib/prompt'
import type { Tag } from '@/lib/types'
import { PasswordGate } from './PasswordGate'
import { Sidebar } from './Sidebar'
import { Milestones } from './Milestones'
import { StatusSelect } from './StatusSelect'
import { CopyButton } from './CopyButton'

function pathOf(u: string): string { try { return new URL(u).pathname } catch { return u } }

async function loadDashboard(slug: string): Promise<Dashboard | null> {
  // Owner path: authenticated read gives the view_token, then reuse get_dashboard.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: owned } = await supabase.from('projects').select('view_token').eq('slug', slug).eq('owner', user.id).maybeSingle()
    if (owned?.view_token) {
      const { data } = await sb.rpc('get_dashboard', { p_slug: slug, p_token: owned.view_token })
      if (data) return data as Dashboard
    }
  }
  // Viewer path: token cookie.
  const token = (await cookies()).get(`pv-${slug}`)?.value
  if (token) {
    const { data } = await sb.rpc('get_dashboard', { p_slug: slug, p_token: token })
    if (data) return data as Dashboard
  }
  return null
}

export default async function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dash = await loadDashboard(slug)
  // No token/session that unlocks this slug -> show the password gate. An unknown
  // slug also lands here (its password can never match), which avoids leaking whether
  // a project exists. notFound() is intentionally not used here.
  if (!dash) return <PasswordGate slug={slug} />

  const { project, tags } = dash
  const pct = progressPct(project.milestones)
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <Sidebar active="basic" />
        <div className="min-w-0 flex-1">
          {/* Basic info */}
          <section id="basic" className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.6875rem] font-semibold text-accent">CLIENTPIN PROJECT</span>
                <h1 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-ink">{project.name}</h1>
                {project.description && <p className="mt-2 max-w-xl text-[0.9375rem] text-ink-dim">{project.description}</p>}
                <p className="mono mt-3 text-[0.75rem] text-ink-mute">Created {new Date(project.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right"><div className="text-[0.6875rem] text-ink-mute">Progress</div><div className="text-[2rem] font-bold text-accent">{pct}%</div></div>
            </div>
            <div className="mt-6"><Milestones milestones={project.milestones} /></div>
            {(project.site_url || project.github_link) && (
              <div className="mt-6">
                <h2 className="text-[0.9375rem] font-semibold text-ink">Build &amp; Test</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.site_url && <a href={project.site_url} target="_blank" rel="noreferrer" className="rounded-lg bg-accent px-4 py-2 text-[0.8125rem] font-medium text-accent-ink">Web service ↗</a>}
                  {project.github_link && <a href={project.github_link} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-4 py-2 text-[0.8125rem] font-medium text-ink-dim">GitHub ↗</a>}
                </div>
              </div>
            )}
          </section>

          {/* QA */}
          <section id="qa" className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-[1.125rem] font-semibold text-ink">QA · {tags.length}</h2>
              {tags.length > 0 && <CopyButton text={buildBulkPrompt(tags as Tag[])} label="Copy AI Fix (open)" className="ring-accent rounded-full bg-accent px-4 py-1.5 text-[0.8125rem] font-medium text-accent-ink" />}
            </div>
            {tags.length ? (
              <ul className="mt-4 flex flex-col gap-3">
                {(tags as Tag[]).map((t) => (
                  <li key={t.id} className="flex gap-4 rounded-xl border border-line p-3">
                    <a href={`${t.page_url}#qa-locate=${t.id}`} target="_blank" rel="noreferrer" className="block h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
                      {t.screenshot_path ? <img src={screenshotUrl(t.screenshot_path)} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-[0.65rem] text-ink-mute">no shot</span>}
                    </a>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] text-ink">{t.comment}</p>
                      <p className="mono mt-1 truncate text-[0.75rem] text-ink-mute">{pathOf(t.page_url)} · &lt;{t.anchor.tagName}&gt;</p>
                      <div className="mt-2 flex items-center gap-3">
                        <StatusSelect slug={slug} tagId={t.id} value={t.status} />
                        <CopyButton text={buildPrompt(t)} className="ring-accent rounded-md px-2 py-1 text-[0.8125rem] font-medium text-accent hover:bg-accent-soft" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center">
                <p className="text-[0.9375rem] font-medium text-ink">No QA tags yet</p>
                <p className="mt-1 text-[0.8125rem] text-ink-dim">Install the ClientPin extension, paste the connect code, and tag components on your site.</p>
                <a href="https://drive.google.com/uc?export=download&id=1BdGhCMq_RWir4spB-5xST8w8hs-ptkpi" target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-[0.8125rem] font-medium text-accent-ink">Install the extension</a>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
```

Note: when `loadDashboard` returns null (no session/token unlocks the slug), the page renders the gate. An unknown slug also renders the gate rather than a 404, so project existence is not leaked. This is deliberate.

- [ ] **Step 4: Verify**

Seed an owner + project via SQL, set a `pv-<slug>` cookie by verifying the password through the UI, and confirm the dashboard renders (progress %, milestones, QA empty state). Build must pass:
```bash
cd panel && npm run build
```
Expected: build succeeds; `/[slug]` shows the gate without a cookie and the dashboard with a valid token.

- [ ] **Step 5: Commit**

```bash
git add "panel/app/[slug]"
git commit -m "feat(web): project dashboard — basic info, milestones, QA, gate"
```

### Task 3.3: Owner milestone editing

**Files:**
- Modify: `panel/app/[slug]/page.tsx` (pass `isOwner` + owner controls), `panel/app/actions.ts` (add `setMilestoneStatus`)
- Create: `panel/app/[slug]/OwnerMilestones.tsx`

**Interfaces:**
- Consumes: `update_project` RPC; owner detection from 3.2.
- Produces: when the signed-in owner views the dashboard, each milestone has a status dropdown that persists.

- [ ] **Step 1: setMilestoneStatus action**

Add to `panel/app/actions.ts`:
```ts
import { createClient as createServer } from '@/lib/supabase/server'
import type { Milestone } from '@/lib/dashboard'

export async function setMilestoneStatus(slug: string, index: number, status: Milestone['status']) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')
  const { data: proj } = await supabase.from('projects').select('name,description,github_link,site_url,milestones').eq('slug', slug).eq('owner', user.id).single()
  if (!proj) throw new Error('not owner')
  const ms = (proj.milestones as Milestone[]).map((m, i) => i === index ? { ...m, status } : m)
  const { error } = await supabase.rpc('update_project', {
    p_slug: slug, p_name: proj.name, p_description: proj.description,
    p_github_link: proj.github_link, p_site_url: proj.site_url, p_milestones: ms,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/${slug}`)
}
```

- [ ] **Step 2: Owner milestone control (client)**

Create `panel/app/[slug]/OwnerMilestones.tsx`:
```tsx
'use client'
import { useTransition } from 'react'
import type { Milestone } from '@/lib/dashboard'
import { setMilestoneStatus } from '../actions'

export function OwnerMilestoneSelect({ slug, index, value }: { slug: string; index: number; value: Milestone['status'] }) {
  const [pending, start] = useTransition()
  return (
    <select disabled={pending} defaultValue={value}
      onChange={(e) => start(() => setMilestoneStatus(slug, index, e.target.value as Milestone['status']))}
      className="ring-accent rounded-full bg-accent-soft px-2 py-0.5 text-[0.6875rem] font-medium text-accent disabled:opacity-60">
      <option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="done">Done</option>
    </select>
  )
}
```

- [ ] **Step 3: Thread `isOwner` into the dashboard**

In `panel/app/[slug]/page.tsx`, have `loadDashboard` also return whether the viewer is the owner (return `{ dash, isOwner }`), pass `isOwner` + `slug` to `<Milestones>`, and in `Milestones.tsx` render `<OwnerMilestoneSelect>` instead of the static status pill when `isOwner` is true. (Milestones gains optional props `isOwner?: boolean; slug?: string`.)

- [ ] **Step 4: Verify build**

Run: `cd panel && npm run build`
Expected: build succeeds; as the owner, milestone dropdowns appear and persist; as a viewer, static pills.

- [ ] **Step 5: Commit**

```bash
git add "panel/app/[slug]" panel/app/actions.ts
git commit -m "feat(web): owner can edit milestone statuses on the dashboard"
```

---

## Phase 4 — Extension (detector)

### Task 4.1: Simplify popup to a connect-code detector

**Files:**
- Modify: `extension/src/supabase.ts` (add `connectProject`, remove `createProject`), `extension/src/projects.ts` (single active project), `extension/src/Popup.tsx` (connect form)

**Interfaces:**
- Consumes: `connect_project` RPC (1.3).
- Produces: a popup that connects via code and stores the active project; tagging stays unchanged.

- [ ] **Step 1: connectProject helper**

In `extension/src/supabase.ts`, remove `createProject` and add:
```ts
export async function connectProject(projectKey: string) {
  const { data, error } = await sb.rpc('connect_project', { p_project_key: projectKey })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('Project not found')
  return { name: row.name as string, slug: row.slug as string, project_key: projectKey }
}
```

- [ ] **Step 2: Rewrite the popup**

Replace `extension/src/Popup.tsx`:
```tsx
import { useEffect, useState } from 'react'
import './popup.css'
import { connectProject } from './supabase'
import { getActive, addProject, type Project } from './projects'

export function Popup() {
  const [active, setActive] = useState<Project | null>(null)
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')

  useEffect(() => { getActive().then(setActive) }, [])

  const connect = async () => {
    if (!code.trim()) return
    setBusy(true); setErr('')
    try { const p = await connectProject(code.trim()); await addProject(p); setActive(p); setCode('') }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="qa-popup">
      <header className="qa-head">
        <span className="qa-mark">C</span>
        <div><div className="qa-title">ClientPin</div><div className="qa-sub">{active ? `Connected: ${active.name}` : 'Element detector'}</div></div>
      </header>
      <label className="qa-field"><span className="qa-label">Connect code</span>
        <input className="qa-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the code from your dashboard" spellCheck={false} /></label>
      {err && <div className="qa-saved show" style={{ color: 'var(--danger, #c0392b)' }}>{err}</div>}
      <button className="qa-btn" onClick={connect} disabled={busy}>{busy ? 'Connecting…' : active ? 'Reconnect' : 'Connect'}</button>
      {active && <div className="qa-saved show">Ready. Use “Tag mode” on your site.</div>}
    </div>
  )
}
```

- [ ] **Step 3: Trim `projects.ts`**

`extension/src/projects.ts` keeps `type Project`, `getActive`, `addProject`, `setActive`, `listProjects` (all still used). `addProject` already sets the new project active. No change needed unless `listProjects` is now unused — leave it; it is harmless. (The content script continues to use `getActive`.)

- [ ] **Step 4: Verify build + tests**

Run: `cd extension && npx vitest run && npm run build`
Expected: anchor + crop tests pass (4 + 2); build emits `dist` with the content script.

- [ ] **Step 5: Commit**

```bash
git add extension/src/supabase.ts extension/src/Popup.tsx
git commit -m "feat(ext): simplify popup to a connect-code detector"
```

---

## Self-review notes

- **Spec coverage:** owner Google auth (2.1, 2.2); onboarding fields + password + success link/code (2.3); landing "Try now" (2.4); owner RLS + create/update RPCs (1.1, 1.2); password view-gate via token cookie (1.3, 3.1); dashboard basic info + progress + milestones + QA + install callout (3.2); owner milestone editing (3.3); connect-code detector extension (4.1); expiry dropped (1.1). All covered.
- **Deferred (per spec):** Dev board / Confirm / Docs are sidebar stubs (3.1 Sidebar `live:false`); members/roles, email-password auth, notifications — none built. Correct.
- **Type consistency:** `Milestone` status `waiting|in_progress|done` identical in `lib/dashboard.ts`, onboarding `actions.ts`, `Milestones.tsx`, `update_project`. Tag status `new|in_progress|resolved` unchanged. RPC param names match between SQL (0009/0010) and the web/extension callers. `Dashboard`/`get_dashboard` jsonb shape consumed consistently in 3.2.
- **Known simplification:** the dashboard's unknown-slug-vs-wrong-password distinction is intentionally collapsed to "show the gate" (Task 3.2 Step 3 note) to avoid leaking project existence; the dead probe lines are to be removed by the implementer.
