-- RLS test: owner B must not see owner A's data.
-- Seed two owners and one project + tag for owner A.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'a@x.com'),
  ('00000000-0000-0000-0000-000000000002', 'b@x.com');

insert into projects (id, name, site_url, owner) values
  ('10000000-0000-0000-0000-000000000001', 'A', 'https://a', '00000000-0000-0000-0000-000000000001');

insert into tags (project_id, page_url, anchor, comment) values
  ('10000000-0000-0000-0000-000000000001', 'https://a/', '{}'::jsonb, 'hi');

-- Act as owner B inside a single transaction so set local takes effect.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000002"}';
do $$
begin
  assert (select count(*) from tags) = 0, 'owner B must not see owner A tags';
end $$;
rollback;
