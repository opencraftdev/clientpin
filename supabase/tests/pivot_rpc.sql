set local role anon;
do $$
declare v_slug text; v_key text; v_id uuid; v_list jsonb;
begin
  select slug, project_key into v_slug, v_key from create_project('Acme', 'https://acme.store');
  assert v_slug is not null and v_key is not null, 'create_project must return slug+key';

  v_id := create_tag(v_key, '{"selector":"button.cta","text":null,"nthOfType":null,"tagName":"button"}'::jsonb,
                     'overlaps on mobile', 'https://acme.store/checkout', 'acme/x.png');
  assert v_id is not null, 'create_tag returns id';

  v_list := get_list(v_slug);
  assert v_list->'project'->>'name' = 'Acme', 'get_list project name';
  assert jsonb_array_length(v_list->'tags') = 1, 'get_list has 1 tag';
  assert (v_list->'tags'->0->>'screenshot_path') = 'acme/x.png', 'screenshot_path stored';

  perform set_status(v_id, 'resolved');
  v_list := get_list(v_slug);
  assert (v_list->'tags'->0->>'status') = 'resolved', 'set_status applied';

  assert get_list('nope') is null, 'unknown slug -> null';

  -- get_tag resolves anchor + page_url
  perform 1 from get_tag(v_id) where page_url = 'https://acme.store/checkout';
  assert found, 'get_tag returns page_url';

  -- bad key raises
  begin
    perform create_tag('BADKEY', '{}'::jsonb, 'x', 'u', null);
    assert false, 'bad key must raise';
  exception when others then null; end;
end $$;
