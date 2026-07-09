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
