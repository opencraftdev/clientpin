-- Owner-only delete of a QA pin (viewers are read-only), mirrors set_status.
create function delete_tag(p_tag_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from tags t
    using projects p
    where t.id = p_tag_id and p.id = t.project_id and p.owner = auth.uid();
  if not found then raise exception 'not found or not owner'; end if;
end $$;
revoke execute on function delete_tag(uuid) from public, anon;
grant execute on function delete_tag(uuid) to authenticated;
