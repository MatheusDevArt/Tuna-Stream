begin;
alter table public.site_opportunities add column origin text not null default 'site' check(origin in ('site','manual'));

create function public.analytics_create_client_sale(sale_id uuid,tenant uuid,actor uuid,details jsonb,contact_digest text,closing_time timestamptz)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare identified uuid; existing public.site_opportunities; ref text; pack text:=details->>'package';
begin
 if not exists(select 1 from public.team_members where user_id=actor and team_id=tenant) then raise exception 'access denied'; end if;
 if sale_id is null or closing_time is null or closing_time>now()+interval '5 minutes' or contact_digest !~ '^[a-f0-9]{64}$'
 or contact_digest is null or nullif(trim(details->>'clientLabel'),'') is null
 or pack not in ('START','LIVE','STREAMER','COMBOS','CUSTOM','GENERAL') or pack is null
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
 insert into public.site_opportunities(id,team_id,reference,contact_hash,package,source,stage,attributed,received_at,won_at,identity_method,confirmation_method,confirmed_by,client_id,client_label,service_category,selected_package,custom_package_name,customer_state,customer_city,origin)
 values(sale_id,tenant,ref,contact_digest,pack,'Cadastro manual','won',true,closing_time,closing_time,'phone','manual',actor,identified,trim(details->>'clientLabel'),details->>'service',pack,case when pack='CUSTOM' then nullif(trim(details->>'customPackageName'),'') else null end,nullif(details->>'state',''),nullif(trim(details->>'city'),''),'manual');
 if pack='CUSTOM' and nullif(trim(details->>'customPackageName'),'') is null then raise exception 'custom package requires name'; end if;
 insert into public.opportunity_history(opportunity_id,team_id,user_id,stage) values(sale_id,tenant,actor,'won');
 return sale_id;
end;
$$;
revoke all on function public.analytics_create_client_sale(uuid,uuid,uuid,jsonb,text,timestamptz) from public,anon,authenticated;
grant execute on function public.analytics_create_client_sale(uuid,uuid,uuid,jsonb,text,timestamptz) to service_role;
commit;
