create function create_tag(p_project_key text, p_anchor jsonb,
                           p_comment text, p_page_url text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_project uuid; v_id uuid;
begin
  select id into v_project from projects where project_key = p_project_key;
  if v_project is null then
    raise exception 'invalid project key';
  end if;
  insert into tags (project_id, page_url, anchor, comment)
  values (v_project, p_page_url, p_anchor, p_comment)
  returning id into v_id;
  return v_id;
end $$;

create function get_tags(p_project_key text, p_page_url text)
returns setof tags language plpgsql security definer set search_path = public as $$
begin
  return query
    select t.* from tags t
    join projects p on p.id = t.project_id
    where p.project_key = p_project_key and t.page_url = p_page_url;
end $$;

grant execute on function create_tag(text, jsonb, text, text) to anon;
grant execute on function get_tags(text, text) to anon;
