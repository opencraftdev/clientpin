insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Public read is implied by public=true; add explicit anon INSERT policy.
create policy screenshots_anon_insert on storage.objects
  for insert to anon
  with check (bucket_id = 'screenshots');

create policy screenshots_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'screenshots');
