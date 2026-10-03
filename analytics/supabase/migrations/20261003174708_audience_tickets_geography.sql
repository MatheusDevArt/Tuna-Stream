alter table public.site_sessions add column if not exists country_code text;
alter table public.site_sessions add column if not exists city text;
alter table public.site_sessions add column if not exists tracking_mode text not null default 'consented' check(tracking_mode in ('consented','anonymous'));
alter table public.whatsapp_intents add column if not exists service_category text not null default 'unknown' check(service_category in ('unknown','configuration','personalization','both'));

create or replace function public.analytics_confirm_link(reference_code text,tenant uuid,actor uuid,reference_digest text,requested boolean)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare intent public.whatsapp_intents; existing public.site_opportunities; result_id uuid;
begin
 if not exists(select 1 from public.team_members where user_id=actor and team_id=tenant) then raise exception 'access denied'; end if;
 select * into intent from public.whatsapp_intents where reference=reference_code and team_id=tenant for update;
 if not found or intent.ambiguous then raise exception 'invalid reference'; end if;
 select * into existing from public.site_opportunities where reference=reference_code and team_id=tenant and attributed limit 1;
 if found then result_id:=existing.id;
 else
  if intent.expires_at<now() then raise exception 'expired reference'; end if;
  perform public.analytics_receive(reference_code,reference_digest,reference_digest,now(),tenant);
  select id into result_id from public.site_opportunities where reference=reference_code and team_id=tenant and attributed;
  if result_id is null then raise exception 'invalid attribution'; end if;
  update public.site_opportunities set identity_method='reference',selected_package=package,service_category=intent.service_category,
   confirmation_method='manual',confirmed_by=actor where id=result_id;
 end if;
 if requested and not exists(select 1 from public.site_opportunities where id=result_id and requested_at is not null) then
  perform public.analytics_change_stage(result_id,tenant,actor,'quote_requested');
 end if;
 return result_id;
end;
$$;
revoke all on function public.analytics_confirm_link(text,uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.analytics_confirm_link(text,uuid,uuid,text,boolean) to service_role;
