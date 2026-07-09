begin;

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

rollback;
