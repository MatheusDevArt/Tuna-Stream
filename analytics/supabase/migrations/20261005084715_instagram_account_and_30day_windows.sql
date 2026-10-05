begin;
create or replace function public.analytics_commit_instagram(tenant uuid,run_id uuid,batch jsonb)
 returns boolean language plpgsql security invoker set search_path='' as $$
declare stamp timestamptz; item jsonb; existing_stamp timestamptz;
begin
 if jsonb_typeof(batch->'periods') is distinct from 'array' or jsonb_typeof(batch->'media') is distinct from 'array'
 or jsonb_array_length(batch->'periods') not between 1 and 5 or jsonb_array_length(batch->'media')>300
 or batch->>'handle' is distinct from 'tuna.stream' then raise exception 'invalid_batch'; end if;
 stamp:=(batch->>'collectedAt')::timestamptz;
 if stamp is null or stamp>now()+interval '5 minutes' then raise exception 'invalid_batch'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(tenant::text||':instagram',0));
 if not exists(select 1 from public.analytics_collection_runs where id=run_id and team_id=tenant and status='running') then raise exception 'invalid_run'; end if;
 select last_success_at into existing_stamp from public.analytics_integrations where team_id=tenant and source='instagram';
 if existing_stamp>stamp then return false; end if;
 insert into public.instagram_daily(team_id,day,metrics,collected_at)
 values(tenant,(batch->>'day')::date,batch->'daily',stamp)
 on conflict(team_id,day) do update set metrics=public.instagram_daily.metrics||excluded.metrics,collected_at=excluded.collected_at;
 for item in select value from jsonb_array_elements(batch->'periods') loop
  if item->'metrics'->'instagramSource'->>'provider' is distinct from 'meta'
  or (item->>'end')::date<(item->>'start')::date or (item->>'end')::date-(item->>'start')::date>29 then raise exception 'invalid_batch'; end if;
  insert into public.instagram_periods(team_id,period_start,period_end,metrics,collected_at)
  values(tenant,(item->>'start')::date,(item->>'end')::date,item->'metrics',stamp)
  on conflict(team_id,period_start,period_end) do update set metrics=excluded.metrics,collected_at=excluded.collected_at;
 end loop;
 for item in select value from jsonb_array_elements(batch->'media') loop
  insert into public.instagram_media(team_id,id,published_at,metrics,collected_at)
  values(tenant,item->>'id',(item->>'published_at')::timestamptz,item->'metrics',stamp)
  on conflict(team_id,id) do update set metrics=excluded.metrics,collected_at=excluded.collected_at;
 end loop;
 insert into public.analytics_integrations(team_id,source,status,mode,last_success_at,last_attempt_at,error_code,last_error_at)
 values(tenant,'instagram','ready','api',stamp,stamp,null,null)
 on conflict(team_id,source) do update set status='ready',mode='api',last_success_at=stamp,last_attempt_at=stamp,error_code=null,last_error_at=null;
 update public.analytics_collection_runs set status=case when batch->>'coverage'='complete' then 'success' else 'partial' end,
 finished_at=now(),summary=jsonb_build_object('periods',jsonb_array_length(batch->'periods'),'media',jsonb_array_length(batch->'media'),'coverage',batch->>'coverage','requests',batch->'requests')
 where id=run_id and team_id=tenant;
 return true;
end $$;
revoke all on function public.analytics_commit_instagram(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.analytics_commit_instagram(uuid,uuid,jsonb) to service_role;
commit;

