do $$
begin
  perform 1 from information_schema.columns where table_name='projects' and column_name='owner';
  assert found, 'projects.owner missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='milestones';
  assert found, 'projects.milestones missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='view_password_hash';
  assert found, 'projects.view_password_hash missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='view_token';
  assert found, 'projects.view_token missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='last_active_at';
  assert not found, 'last_active_at should be dropped';
  perform 1 from pg_proc where proname='purge_expired';
  assert not found, 'purge_expired should be dropped';
  perform 1 from pg_policies where tablename='projects' and policyname='projects_owner';
  assert found, 'owner RLS policy missing';
end $$;
