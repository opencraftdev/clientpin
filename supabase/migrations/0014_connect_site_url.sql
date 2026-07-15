-- connect_project also returns the registered site so the extension can scope
-- Tag mode to that site instead of showing on every page.
drop function if exists connect_project(text);
create function connect_project(p_project_key text)
returns table(name text, slug text, site_url text)
language sql security definer set search_path = public stable as $$
  select name, slug, site_url from projects where project_key = p_project_key;
$$;
grant execute on function connect_project(text) to anon;
