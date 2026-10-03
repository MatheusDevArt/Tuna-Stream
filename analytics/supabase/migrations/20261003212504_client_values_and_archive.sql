begin;
alter table public.site_opportunities
 add column sale_amount numeric(12,2) check(sale_amount between 0 and 9999999999.99),
 add column archived_at timestamptz,
 add column archived_by uuid references auth.users(id) on delete set null;
alter table public.site_opportunities drop constraint selected_package_valid;
alter table public.site_opportunities add constraint selected_package_valid check(selected_package in ('START','LIVE','STREAMER','COMBOS','CUSTOM','AVULSO','GENERAL'));
create or replace function public.analytics_save_client(opportunity uuid,tenant uuid,actor uuid,details jsonb,contact_digest text default null)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare item public.site_opportunities; identity public.site_clients; identified uuid;
begin
 if not exists(select 1 from public.team_members where user_id=actor and team_id=tenant) then raise exception 'access denied'; end if;
 -- Keep lock order consistent with receipt confirmation: intent, then opportunity.
 perform 1 from public.whatsapp_intents where reference=(select reference from public.site_opportunities where id=opportunity and team_id=tenant) and team_id=tenant for update;
 select * into item from public.site_opportunities where id=opportunity and team_id=tenant and attributed and archived_at is null for update;
 if not found then raise exception 'access denied'; end if;
 if contact_digest is not null then
  if contact_digest !~ '^[a-f0-9]{64}$' then raise exception 'invalid input'; end if;
  if item.identity_method='phone' and item.contact_hash<>contact_digest then raise exception 'identity conflict'; end if;
  if item.identity_method='reference' then
   perform public.analytics_attach_contact(item.reference,tenant,actor,contact_digest,item.received_at);
  end if;
  insert into public.site_clients(team_id,contact_hash) values(tenant,contact_digest)
   on conflict(team_id,contact_hash) do update set contact_hash=excluded.contact_hash returning id into identified;
 elsif item.identity_method='phone' then
  insert into public.site_clients(team_id,contact_hash) values(tenant,item.contact_hash)
   on conflict(team_id,contact_hash) do update set contact_hash=excluded.contact_hash returning id into identified;
 else identified:=item.client_id;
 end if;
 update public.site_opportunities set client_id=identified,
  sale_amount=(details->>'saleAmount')::numeric,
  client_label=nullif(trim(details->>'clientLabel'),''),
  selected_package=details->>'package',
  custom_package_name=case when details->>'package' in ('CUSTOM','AVULSO') then nullif(trim(details->>'customPackageName'),'') else null end,
  service_category=details->>'service',customer_state=nullif(details->>'state',''),
  customer_city=nullif(trim(details->>'city'),'') where id=opportunity;
 if details->>'package' in ('CUSTOM','AVULSO') and nullif(trim(details->>'customPackageName'),'') is null then raise exception 'custom package requires name'; end if;
 return opportunity;
end;
$$;
revoke all on function public.analytics_save_client(uuid,uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.analytics_save_client(uuid,uuid,uuid,jsonb,text) to service_role;

create or replace function public.analytics_create_client_sale(sale_id uuid,tenant uuid,actor uuid,details jsonb,contact_digest text,closing_time timestamptz)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare identified uuid; existing public.site_opportunities; ref text; pack text:=details->>'package';
begin
 if not exists(select 1 from public.team_members where user_id=actor and team_id=tenant) then raise exception 'access denied'; end if;
 if sale_id is null or closing_time is null or closing_time>now()+interval '5 minutes' or contact_digest !~ '^[a-f0-9]{64}$'
 or contact_digest is null or nullif(trim(details->>'clientLabel'),'') is null
 or pack not in ('START','LIVE','STREAMER','COMBOS','CUSTOM','AVULSO','GENERAL') or pack is null
 or details->>'service' not in ('unknown','configuration','personalization','both') or details->>'service' is null then raise exception 'invalid input'; end if;
 perform pg_advisory_xact_lock(hashtext(tenant::text),hashtext(sale_id::text));
 select * into existing from public.site_opportunities where id=sale_id;
 if found then
  if existing.team_id<>tenant or existing.origin<>'manual' or existing.contact_hash<>contact_digest then raise exception 'access denied'; end if;
  return sale_id;
 end if;
 ref:='TS-'||pack||'-'||upper(replace(sale_id::text,'-',''));
 insert into public.site_clients(team_id,contact_hash) values(tenant,contact_digest)
 on conflict(team_id,contact_hash) do update set contact_hash=excluded.contact_hash returning id into identified;
 insert into public.whatsapp_intents(reference,team_id,package,source,claimed_contact)
 values(ref,tenant,pack,'Cadastro manual',contact_digest);
 insert into public.site_opportunities(id,team_id,reference,contact_hash,package,source,stage,attributed,received_at,won_at,identity_method,confirmation_method,confirmed_by,client_id,client_label,service_category,selected_package,custom_package_name,customer_state,customer_city,origin,sale_amount)
 values(sale_id,tenant,ref,contact_digest,pack,'Cadastro manual','won',true,closing_time,closing_time,'phone','manual',actor,identified,trim(details->>'clientLabel'),details->>'service',pack,case when pack in ('CUSTOM','AVULSO') then nullif(trim(details->>'customPackageName'),'') else null end,nullif(details->>'state',''),nullif(trim(details->>'city'),''),'manual',(details->>'saleAmount')::numeric);
 if pack in ('CUSTOM','AVULSO') and nullif(trim(details->>'customPackageName'),'') is null then raise exception 'custom package requires name'; end if;
 insert into public.opportunity_history(opportunity_id,team_id,user_id,stage) values(sale_id,tenant,actor,'won');
 return sale_id;
end;
$$;
revoke all on function public.analytics_create_client_sale(uuid,uuid,uuid,jsonb,text,timestamptz) from public,anon,authenticated;
grant execute on function public.analytics_create_client_sale(uuid,uuid,uuid,jsonb,text,timestamptz) to service_role;

create function public.analytics_archive_client(opportunity uuid,tenant uuid,actor uuid,restore boolean default false)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare identified uuid;
begin
 if not exists(select 1 from public.team_members where user_id=actor and team_id=tenant) then raise exception 'access denied'; end if;
 select client_id into identified from public.site_opportunities where id=opportunity and team_id=tenant and attributed;
 if identified is null then raise exception 'access denied'; end if;
 perform 1 from public.site_clients where id=identified and team_id=tenant for update;
 update public.site_opportunities set archived_at=case when restore then null else now() end,
 archived_by=case when restore then null else actor end where client_id=identified and team_id=tenant;
 return identified;
end;
$$;
revoke all on function public.analytics_archive_client(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.analytics_archive_client(uuid,uuid,uuid,boolean) to service_role;
commit;
