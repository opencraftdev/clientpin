-- Remove the 7-day expiry machinery (owned projects persist)
select cron.unschedule('purge_expired') where exists (select 1 from cron.job where jobname='purge_expired');
drop function if exists purge_expired();
alter table projects drop column if exists last_active_at;

-- New project fields
alter table projects add column if not exists owner uuid references auth.users(id) on delete cascade;
alter table projects add column if not exists description text;
alter table projects add column if not exists github_link text;
alter table projects add column if not exists milestones jsonb not null default '[]'::jsonb;
alter table projects add column if not exists view_password_hash text;
alter table projects add column if not exists view_token text;
alter table projects add column if not exists updated_at timestamptz not null default now();

-- Owner RLS (tables otherwise RPC-only)
drop policy if exists projects_owner on projects;
create policy projects_owner on projects
  for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());
