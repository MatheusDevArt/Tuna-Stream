begin;
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The cron command contains no credentials. Only this private function reads Vault.
create function public.analytics_queue_instagram_collection() returns bigint
 language plpgsql security definer set search_path='' as $$
declare settings jsonb; project_url text;
begin
 settings:=public.analytics_instagram_runtime();
 select decrypted_secret into project_url from vault.decrypted_secrets where name='tuna_instagram_project_url';
 if settings is null or length(settings->>'INSTAGRAM_CRON_SECRET')<32
 or project_url is null or project_url !~ '^https://[a-z0-9]+\.supabase\.co$'
 then raise exception 'configuration_missing'; end if;
 return net.http_post(url:=project_url||'/functions/v1/tuna-instagram-sync',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(settings->>'INSTAGRAM_CRON_SECRET')),
  body:='{}'::jsonb,timeout_milliseconds:=120000);
end $$;

create function public.analytics_instagram_schedule_status() returns boolean
 language sql security definer set search_path='' as $$
 select exists(select 1 from cron.job where jobname='tuna-instagram-hourly' and active);
$$;

create function public.analytics_activate_instagram_schedule() returns boolean
 language plpgsql security definer set search_path='' as $$
declare settings jsonb; tenant uuid;
begin
 perform pg_advisory_xact_lock(hashtext('tuna-instagram-schedule'));
 settings:=public.analytics_instagram_runtime(); tenant:=(settings->>'TUNA_TEAM_ID')::uuid;
 if tenant is null or not exists(select 1 from public.provider_credentials
 where team_id=tenant and provider='instagram' and expires_at>now())
 or not exists(select 1 from public.analytics_collection_runs where team_id=tenant
 and provider='meta' and status in ('success','partial') and finished_at>now()-interval '2 hours')
 or not exists(select 1 from vault.secrets where name='tuna_instagram_project_url')
 then raise exception 'authorization_or_valid_collection_required'; end if;
 -- Check every 15 minutes; the worker collects only when its last success is >=55 minutes old.
 perform cron.schedule('tuna-instagram-hourly','*/15 * * * *','select public.analytics_queue_instagram_collection();');
 return public.analytics_instagram_schedule_status();
end $$;

revoke all on function public.analytics_queue_instagram_collection(),public.analytics_instagram_schedule_status(),public.analytics_activate_instagram_schedule() from public,anon,authenticated;
grant execute on function public.analytics_queue_instagram_collection(),public.analytics_instagram_schedule_status(),public.analytics_activate_instagram_schedule() to service_role;
commit;
