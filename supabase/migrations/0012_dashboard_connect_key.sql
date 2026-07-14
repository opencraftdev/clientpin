-- Auto-connect: expose project_key in the dashboard payload so the panel can
-- hand it to the browser extension instead of the client copy-pasting the code.
-- Safe: get_dashboard is security-definer and still only returns data to a
-- caller who already holds a valid view_token (i.e. unlocked the list).
create or replace function get_dashboard(p_slug text, p_token text)
returns jsonb language sql security definer set search_path = public stable as $$
  select case when p.id is null then null else jsonb_build_object(
    'project', jsonb_build_object(
      'name', p.name, 'description', p.description, 'github_link', p.github_link,
      'site_url', p.site_url, 'slug', p.slug, 'milestones', p.milestones,
      'created_at', p.created_at, 'project_key', p.project_key),
    'tags', coalesce((select jsonb_agg(jsonb_build_object(
        'id', t.id, 'page_url', t.page_url, 'anchor', t.anchor, 'comment', t.comment,
        'status', t.status, 'screenshot_path', t.screenshot_path, 'created_at', t.created_at
      ) order by t.created_at desc) from tags t where t.project_id = p.id), '[]'::jsonb)
  ) end
  from projects p where p.slug = p_slug and p.view_token = p_token;
$$;
