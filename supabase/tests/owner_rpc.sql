begin;

insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001','o@x.com');
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000001"}';

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

rollback;
