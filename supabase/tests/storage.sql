do $$
begin
  perform 1 from storage.buckets where id = 'screenshots' and public = true;
  assert found, 'screenshots bucket missing or not public';
  perform 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname = 'screenshots_anon_insert';
  assert found, 'anon insert policy missing';
end $$;
