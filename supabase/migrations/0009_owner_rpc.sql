-- Drop the pivot's anon create_project (2-arg) and get_list; replaced here / in 0010.
drop function if exists create_project(text, text);

-- site_url is optional for owner-managed projects
alter table projects alter column site_url drop not null;

create function create_project(p_name text, p_description text, p_github_link text,
                               p_site_url text, p_milestones jsonb, p_view_password text)
returns table(slug text, project_key text)
language plpgsql security definer set search_path = public, extensions as $$
declare v_slug text; v_key text; v_owner uuid;
begin
  v_owner := auth.uid();
  if v_owner is null then raise exception 'not authenticated'; end if;
  v_slug := gen_token(10);
  v_key  := replace(gen_random_uuid()::text, '-', '');
  insert into projects (name, description, github_link, site_url, milestones, owner,
                        slug, project_key, view_token, view_password_hash)
  values (p_name, p_description, p_github_link, p_site_url, coalesce(p_milestones,'[]'::jsonb), v_owner,
          v_slug, v_key, gen_token(24), crypt(p_view_password, gen_salt('bf')));
  slug := v_slug; project_key := v_key; return next;
end $$;

create function update_project(p_slug text, p_name text, p_description text,
                               p_github_link text, p_site_url text, p_milestones jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update projects set name = p_name, description = p_description, github_link = p_github_link,
    site_url = p_site_url, milestones = coalesce(p_milestones,'[]'::jsonb), updated_at = now()
  where slug = p_slug and owner = auth.uid();
  if not found then raise exception 'not found or not owner'; end if;
end $$;

grant execute on function create_project(text,text,text,text,jsonb,text) to authenticated;
grant execute on function update_project(text,text,text,text,text,jsonb) to authenticated;
