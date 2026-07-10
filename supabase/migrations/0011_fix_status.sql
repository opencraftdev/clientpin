-- create_tag referenced the dropped last_active_at column -> redefine without it (extension tagging).
create or replace function create_tag(p_project_key text, p_anchor jsonb, p_comment text,
                                      p_page_url text, p_screenshot_path text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_project uuid; v_id uuid;
begin
  select id into v_project from projects where project_key = p_project_key;
  if v_project is null then raise exception 'invalid project key'; end if;
  insert into tags (project_id, page_url, anchor, comment, screenshot_path)
  values (v_project, p_page_url, p_anchor, p_comment, p_screenshot_path)
  returning id into v_id;
  return v_id;
end $$;
grant execute on function create_tag(text,jsonb,text,text,text) to anon;

-- set_status was anon + unscoped + referenced last_active_at -> owner-only (viewers are read-only).
drop function if exists set_status(uuid, text);
create function set_status(p_tag_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('new','in_progress','resolved') then raise exception 'invalid status'; end if;
  update tags t set status = p_status
    from projects p where t.id = p_tag_id and p.id = t.project_id and p.owner = auth.uid();
  if not found then raise exception 'not found or not owner'; end if;
end $$;
-- ponytail: revoke PUBLIC+anon; Supabase local grants EXECUTE to PUBLIC by default on new functions
revoke execute on function set_status(uuid, text) from public, anon;
grant execute on function set_status(uuid, text) to authenticated;
