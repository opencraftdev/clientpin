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
