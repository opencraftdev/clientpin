create extension if not exists pg_cron;

create or replace function purge_expired() returns int
language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  -- remove screenshots for projects about to be deleted
  delete from storage.objects
  where bucket_id = 'screenshots'
    and split_part(name, '/', 1) in (
      select slug from projects where last_active_at < now() - interval '7 days');

  with del as (
    delete from projects where last_active_at < now() - interval '7 days' returning 1)
  select count(*) into v_count from del;
  return v_count;
end $$;

-- Daily at 03:00 UTC. unschedule first to stay idempotent on re-run.
select cron.unschedule('purge_expired') where exists (
  select 1 from cron.job where jobname = 'purge_expired');
select cron.schedule('purge_expired', '0 3 * * *', $$select purge_expired();$$);
