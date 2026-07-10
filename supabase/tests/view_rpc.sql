begin;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001','o@x.com');
-- create a project as the owner
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000001"}';
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

rollback;
