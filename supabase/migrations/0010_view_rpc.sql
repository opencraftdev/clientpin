drop function if exists get_list(text);

create function verify_view_password(p_slug text, p_password text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_token text;
begin
  select view_password_hash, view_token into v_hash, v_token from projects where slug = p_slug;
  if v_hash is null then return null; end if;
  if crypt(p_password, v_hash) = v_hash then return v_token; end if;
  return null;
end $$;

create function get_dashboard(p_slug text, p_token text)
returns jsonb language sql security definer set search_path = public stable as $$
  select case when p.id is null then null else jsonb_build_object(
    'project', jsonb_build_object(
      'name', p.name, 'description', p.description, 'github_link', p.github_link,
      'site_url', p.site_url, 'slug', p.slug, 'milestones', p.milestones,
      'created_at', p.created_at),
    'tags', coalesce((select jsonb_agg(jsonb_build_object(
        'id', t.id, 'page_url', t.page_url, 'anchor', t.anchor, 'comment', t.comment,
        'status', t.status, 'screenshot_path', t.screenshot_path, 'created_at', t.created_at
      ) order by t.created_at desc) from tags t where t.project_id = p.id), '[]'::jsonb)
  ) end
  from projects p where p.slug = p_slug and p.view_token = p_token;
$$;

create function connect_project(p_project_key text)
returns table(name text, slug text)
language sql security definer set search_path = public stable as $$
  select name, slug from projects where project_key = p_project_key;
$$;

grant execute on function verify_view_password(text,text) to anon;
grant execute on function get_dashboard(text,text)        to anon;
grant execute on function connect_project(text)           to anon;
