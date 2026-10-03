begin;
create table public.site_clients (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.teams(id) on delete cascade,
 contact_hash text not null,
 created_at timestamptz not null default now(),
 unique(team_id,contact_hash),
 unique(team_id,id)
);
alter table public.site_clients enable row level security;
revoke all on public.site_clients from anon,authenticated;
grant all on public.site_clients to service_role;
-- No client hash is exposed to the browser. Only opaque IDs are returned on opportunities.
alter table public.site_opportunities
 add column client_id uuid,
 add column client_label text check(length(client_label)<=80),
 add column service_category text not null default 'unknown' check(service_category in ('unknown','configuration','personalization','both')),
 add column custom_package_name text check(length(custom_package_name)<=80),
 add column customer_state text check(customer_state in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
 add column customer_city text check(length(customer_city)<=80),
 add constraint opportunity_client_same_team foreign key(team_id,client_id) references public.site_clients(team_id,id);
-- Backfill only phone identities; reference placeholders never count as unique people.
insert into public.site_clients(team_id,contact_hash)
 select distinct team_id,contact_hash from public.site_opportunities where identity_method='phone' and attributed
 on conflict do nothing;
update public.site_opportunities o set client_id=c.id from public.site_clients c
 where o.team_id=c.team_id and o.contact_hash=c.contact_hash and o.identity_method='phone' and o.attributed;

create function public.analytics_save_client(opportunity uuid,tenant uuid,actor uuid,details jsonb,contact_digest text default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare item public.site_opportunities; identity public.site_clients; identified uuid;
begin
 if not exists(select 1 from public.team_members where user_id=actor and team_id=tenant) then raise exception 'access denied'; end if;
 -- Keep lock order consistent with receipt confirmation: intent, then opportunity.
 perform 1 from public.whatsapp_intents where reference=(select reference from public.site_opportunities where id=opportunity and team_id=tenant) and team_id=tenant for update;
 select * into item from public.site_opportunities where id=opportunity and team_id=tenant and attributed for update;
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
  client_label=nullif(trim(details->>'clientLabel'),''),
  selected_package=details->>'package',
  custom_package_name=case when details->>'package'='CUSTOM' then nullif(trim(details->>'customPackageName'),'') else null end,
  service_category=details->>'service',customer_state=nullif(details->>'state',''),
  customer_city=nullif(trim(details->>'city'),'') where id=opportunity;
 if details->>'package'='CUSTOM' and nullif(trim(details->>'customPackageName'),'') is null then raise exception 'custom package requires name'; end if;
 return opportunity;
end;
$$;
revoke all on function public.analytics_save_client(uuid,uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.analytics_save_client(uuid,uuid,uuid,jsonb,text) to service_role;
commit;
