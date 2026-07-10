begin;

-- 1. Seed owner and create a project + tag as authenticated user.
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000099','fix@test.com');
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000099"}';

do $$
declare
  v_slug text; v_key text; v_tag_id uuid; v_token text;
  anon_raised boolean := false;
  owner_raised boolean := false;
begin
  -- create_project (uses 6-arg owner_rpc signature)
  select slug, project_key into v_slug, v_key from create_project(
    'FixTest', 'desc', null, 'https://fix.test',
    '[]'::jsonb, 'pw1');
  assert v_slug is not null, 'project created';

  -- 1b. create_tag must not throw (this was the last_active_at bug)
  v_tag_id := create_tag(v_key, '{"selector":"h1","text":"hi","nthOfType":null,"tagName":"H1"}'::jsonb,
                          'test comment', 'https://fix.test/page', null);
  assert v_tag_id is not null, 'create_tag returned a uuid';

  -- 2. Attempt set_status as anon -> must raise (permission denied: no execute grant).
  set local role anon;
  begin
    perform set_status(v_tag_id, 'resolved');
  exception when others then
    anon_raised := true;
  end;
  assert anon_raised, 'set_status must be denied for anon';

  -- 3. Switch back to owner: set_status must succeed (no exception = owner check passed).
  set local role authenticated;
  set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000099"}';
  begin
    perform set_status(v_tag_id, 'resolved');
  exception when others then
    owner_raised := true;
  end;
  assert not owner_raised, 'set_status must succeed for owner';

  -- 3b. Verify the status update via get_dashboard (SECURITY DEFINER, bypasses RLS).
  select view_token into v_token from projects where slug = v_slug;
  assert (select (get_dashboard(v_slug, v_token)->'tags'->0->>'status') = 'resolved'),
    'tag status is resolved in get_dashboard';

  raise notice 'fix_status tests passed';
end $$;

rollback;
