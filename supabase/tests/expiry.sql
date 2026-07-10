-- seed: one stale, one fresh
insert into projects (name, site_url, slug, project_key, last_active_at) values
  ('Stale','https://s','staleslug1','k1', now() - interval '8 days'),
  ('Fresh','https://f','freshslug1','k2', now() - interval '1 day');
do $$
declare removed int;
begin
  removed := purge_expired();
  assert removed = 1, 'exactly one stale project purged';
  perform 1 from projects where slug = 'staleslug1';
  assert not found, 'stale project gone';
  perform 1 from projects where slug = 'freshslug1';
  assert found, 'fresh project kept';
end $$;
