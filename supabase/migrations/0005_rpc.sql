-- Replace the old 4-arg create_tag (from 0003) with the 5-arg version.
drop function if exists create_tag(text, jsonb, text, text);

create function create_project(p_name text, p_site_url text)
returns table(slug text, project_key text)
language plpgsql security definer set search_path = public, extensions as $$
declare v_slug text; v_key text;
begin
  v_slug := gen_token(10);
  v_key  := replace(gen_random_uuid()::text, '-', '');
  insert into projects (name, site_url, slug, project_key)
  values (p_name, p_site_url, v_slug, v_key);
  slug := v_slug; project_key := v_key; return next;
end $$;

create function create_tag(p_project_key text, p_anchor jsonb, p_comment text,
                           p_page_url text, p_screenshot_path text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_project uuid; v_id uuid;
begin
  select id into v_project from projects where project_key = p_project_key;
  if v_project is null then raise exception 'invalid project key'; end if;
  insert into tags (project_id, page_url, anchor, comment, screenshot_path)
  values (v_project, p_page_url, p_anchor, p_comment, p_screenshot_path)
  returning id into v_id;
  update projects set last_active_at = now() where id = v_project;
  return v_id;
end $$;

create function get_list(p_slug text)
returns jsonb language sql security definer set search_path = public stable as $$
  select case when p.id is null then null else jsonb_build_object(
    'project', jsonb_build_object('name', p.name, 'site_url', p.site_url,
                                  'slug', p.slug, 'last_active_at', p.last_active_at),
    'tags', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'page_url', t.page_url, 'anchor', t.anchor, 'comment', t.comment,
        'status', t.status, 'screenshot_path', t.screenshot_path, 'created_at', t.created_at
      ) order by t.created_at desc)
      from tags t where t.project_id = p.id), '[]'::jsonb)
  ) end
  from projects p where p.slug = p_slug;
$$;

create function get_tag(p_tag_id uuid)
returns table(anchor jsonb, page_url text)
language sql security definer set search_path = public stable as $$
  select anchor, page_url from tags where id = p_tag_id;
$$;

create function set_status(p_tag_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('new','in_progress','resolved') then
    raise exception 'invalid status';
  end if;
  update tags set status = p_status where id = p_tag_id;
  update projects p set last_active_at = now()
    from tags t where t.id = p_tag_id and p.id = t.project_id;
end $$;

grant execute on function create_project(text, text)               to anon;
grant execute on function create_tag(text, jsonb, text, text, text) to anon;
grant execute on function get_list(text)                           to anon;
grant execute on function get_tag(uuid)                            to anon;
grant execute on function set_status(uuid, text)                   to anon;
-- get_tags(text,text) grant persists from 0003.
