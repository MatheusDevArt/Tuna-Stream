begin;
create table public.analytics_users (
 username text primary key check(username=lower(username)),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 team_id uuid not null references public.teams(id) on delete cascade
);
create table public.site_sessions (
 id uuid primary key,
 team_id uuid not null references public.teams(id) on delete cascade,
 visitor_id uuid not null,
 source text not null,
 device text not null check(device in ('Celular','Computador','Tablet')),
 state_code text,
 created_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 active_seconds integer not null default 0 check(active_seconds between 0 and 86400)
);
create index site_sessions_team_created_idx on public.site_sessions(team_id,created_at);
create table public.site_events (
 id uuid primary key,
 team_id uuid not null references public.teams(id) on delete cascade,
 session_id uuid not null references public.site_sessions(id) on delete cascade,
 kind text not null check(kind in ('section','scroll','package','whatsapp','heartbeat','performance','error')),
 label text not null,
 value numeric,
 created_at timestamptz not null default now()
);
create index site_events_team_created_idx on public.site_events(team_id,created_at);
create table public.whatsapp_intents (
 reference text primary key,
 team_id uuid not null references public.teams(id) on delete cascade,
 package text not null,
 source text not null,
 session_id uuid references public.site_sessions(id) on delete set null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default(now()+interval '7 days'),
 claimed_contact text,
 ambiguous boolean not null default false
);
create index whatsapp_intents_team_created_idx on public.whatsapp_intents(team_id,created_at);
create table public.site_opportunities (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.teams(id) on delete cascade,
 reference text not null references public.whatsapp_intents(reference),
 contact_hash text not null,
 package text not null,
 source text not null,
 stage text not null default 'new' check(stage in ('new','quote_requested','quote_sent','won','lost')),
 attributed boolean not null default true,
 received_at timestamptz not null,
 requested_at timestamptz,
 sent_at timestamptz,
 won_at timestamptz,
 unique(team_id,reference,contact_hash)
);
create index site_opportunities_team_received_idx on public.site_opportunities(team_id,received_at);
create table public.opportunity_history (
 id bigint generated always as identity primary key,
 opportunity_id uuid not null references public.site_opportunities(id) on delete cascade,
 team_id uuid not null references public.teams(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 stage text not null,
 created_at timestamptz not null default now()
);
create table public.whatsapp_receipts (
 message_hash text primary key,
 team_id uuid not null references public.teams(id) on delete cascade,
 received_at timestamptz not null,
 opportunity_id uuid references public.site_opportunities(id)
);
create table public.analytics_integrations (
 team_id uuid not null references public.teams(id) on delete cascade,
 source text not null check(source in ('website','instagram','whatsapp')),
 status text not null default 'pending' check(status in ('pending','ready','error')),
 last_success_at timestamptz,
 error_code text,
 primary key(team_id,source)
);
create table public.instagram_daily (
 team_id uuid not null references public.teams(id) on delete cascade,
 day date not null,
 metrics jsonb not null,
 collected_at timestamptz not null default now(),
 primary key(team_id,day)
);
create table public.instagram_media (
 team_id uuid not null references public.teams(id) on delete cascade,
 id text not null,
 published_at timestamptz not null,
 metrics jsonb not null,
 collected_at timestamptz not null default now(),
 primary key(team_id,id)
);
create index instagram_media_team_published_idx on public.instagram_media(team_id,published_at);
create table public.report_preferences (
 team_id uuid primary key references public.teams(id) on delete cascade,
 weekday integer not null default 1 check(weekday between 0 and 6),
 send_time time not null default '09:00',
 timezone text not null default 'America/Sao_Paulo' check(timezone='America/Sao_Paulo'),
 enabled boolean not null default false,
 updated_at timestamptz not null default now()
);
create table public.report_deliveries (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.teams(id) on delete cascade,
 period_start date not null,
 report_type text not null check(report_type in ('website','instagram')),
 status text not null default 'queued' check(status in ('queued','rendering','sending','sent','delivered','read','failed','uncertain')),
 provider_message_id text,
 error_code text,
 attempt integer not null default 0,
 updated_at timestamptz not null default now(),
 unique(team_id,period_start,report_type)
);
create index report_deliveries_provider_idx on public.report_deliveries(provider_message_id) where provider_message_id is not null;
create table public.analytics_rate_limits (
 bucket text primary key,
 hits integer not null default 1,
 expires_at timestamptz not null
);
do $$ declare tab text; begin
 foreach tab in array array['analytics_users','site_sessions','site_events','whatsapp_intents','site_opportunities','opportunity_history','whatsapp_receipts','analytics_integrations','instagram_daily','instagram_media','report_preferences','report_deliveries','analytics_rate_limits'] loop
  execute format('alter table public.%I enable row level security',tab);
  execute format('revoke all on public.%I from anon,authenticated',tab);
 end loop;
 foreach tab in array array['site_opportunities','opportunity_history','analytics_integrations','report_preferences','report_deliveries'] loop
  execute format('grant select on public.%I to authenticated',tab);
  execute format('create policy team_read on public.%I for select to authenticated using(exists(select 1 from public.team_members m where m.team_id=%I.team_id and m.user_id=(select auth.uid())))',tab,tab);
 end loop;
end $$;
-- All write routines are callable only by the trusted edge server.
create function public.analytics_take_rate(bucket_key text, max_hits integer, lifetime integer) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer;
begin
 insert into analytics_rate_limits(bucket,hits,expires_at) values(bucket_key,1,now()+make_interval(secs=>lifetime))
 on conflict(bucket) do update set hits=case when analytics_rate_limits.expires_at<now() then 1 else analytics_rate_limits.hits+1 end,
 expires_at=case when analytics_rate_limits.expires_at<now() then now()+make_interval(secs=>lifetime) else analytics_rate_limits.expires_at end returning hits into n;
 return n<=max_hits;
end $$;
revoke all on function public.analytics_take_rate(text,integer,integer) from public,anon,authenticated;
grant execute on function public.analytics_take_rate(text,integer,integer) to service_role;
create function public.analytics_receive(reference_code text,contact_digest text,message_digest text,message_time timestamptz,tenant uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare intent whatsapp_intents%rowtype; opportunity uuid; inserted integer;
begin
 insert into whatsapp_receipts(message_hash,team_id,received_at) values(message_digest,tenant,message_time) on conflict do nothing;
 get diagnostics inserted=row_count; if inserted=0 then return; end if;
 select * into intent from whatsapp_intents where reference=reference_code and team_id=tenant for update;
 if not found or intent.expires_at<message_time or intent.created_at>message_time+interval '5 minutes' or intent.ambiguous then return; end if;
 if intent.claimed_contact is not null and intent.claimed_contact<>contact_digest then
  update whatsapp_intents set ambiguous=true where reference=reference_code;
  update site_opportunities set attributed=false where reference=reference_code and team_id=tenant;
  return;
 end if;
 update whatsapp_intents set claimed_contact=contact_digest where reference=reference_code;
 insert into site_opportunities(team_id,reference,contact_hash,package,source,received_at)
 values(tenant,reference_code,contact_digest,intent.package,intent.source,message_time)
 on conflict(team_id,reference,contact_hash) do update set received_at=least(site_opportunities.received_at,excluded.received_at) returning id into opportunity;
 update whatsapp_receipts set opportunity_id=opportunity where message_hash=message_digest;
end $$;
revoke all on function public.analytics_receive(text,text,text,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.analytics_receive(text,text,text,timestamptz,uuid) to service_role;
create function public.analytics_change_stage(opportunity uuid,tenant uuid,actor uuid,next_stage text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if next_stage not in ('new','quote_requested','quote_sent','won','lost') then raise exception 'invalid_stage'; end if;
 if not exists(select 1 from team_members where team_id=tenant and user_id=actor) then raise exception 'access_denied'; end if;
 update site_opportunities set stage=next_stage,
 requested_at=case when next_stage in ('quote_requested','quote_sent','won') then coalesce(requested_at,now()) else requested_at end,
 sent_at=case when next_stage in ('quote_sent','won') then coalesce(sent_at,now()) else sent_at end,
 won_at=case when next_stage='won' then coalesce(won_at,now()) else won_at end
 where id=opportunity and team_id=tenant;
 if not found then raise exception 'not_found'; end if;
 insert into opportunity_history(opportunity_id,team_id,user_id,stage) values(opportunity,tenant,actor,next_stage);
end $$;
revoke all on function public.analytics_change_stage(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.analytics_change_stage(uuid,uuid,uuid,text) to service_role;
commit;
