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
