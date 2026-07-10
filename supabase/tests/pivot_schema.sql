do $$
begin
  -- new columns exist, owner is gone
  perform 1 from information_schema.columns where table_name='projects' and column_name='slug';
  assert found, 'projects.slug missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='last_active_at';
  assert found, 'projects.last_active_at missing';
  perform 1 from information_schema.columns where table_name='tags' and column_name='screenshot_path';
  assert found, 'tags.screenshot_path missing';
  perform 1 from information_schema.columns where table_name='projects' and column_name='owner';
  assert not found, 'projects.owner should be dropped';
end $$;
-- slug/key generator produces url-safe, correct-length tokens
do $$
declare s text; begin
  s := gen_token(10);
  assert length(s) >= 10, 'gen_token too short';
  assert s ~ '^[A-Za-z0-9_-]+$', 'gen_token not url-safe';
end $$;
