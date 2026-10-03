begin;
create table public.site_visitors (
 team_id uuid not null references public.teams(id) on delete cascade,
 visitor_id uuid not null,
 first_seen_at timestamptz not null default now(),
 primary key(team_id,visitor_id)
);
create table public.analytics_geo_cache (
 team_id uuid not null references public.teams(id) on delete cascade,
 period_start date not null,
 period_end date not null,
 metrics jsonb not null,
 updated_at timestamptz not null default now(),
 primary key(team_id,period_start,period_end)
);
alter table public.site_sessions add column first_seen_at timestamptz;
alter table public.site_sessions add column browser text;
alter table public.site_sessions add column operating_system text;
alter table public.site_sessions add column page text;
alter table public.site_events drop constraint site_events_kind_check;
alter table public.site_events add constraint site_events_kind_check check(kind in ('section','scroll','package','whatsapp','heartbeat','performance','error','click'));
alter table public.site_events add column context text;
alter table public.site_visitors enable row level security;
alter table public.analytics_geo_cache enable row level security;
revoke all on public.site_visitors,public.analytics_geo_cache from anon,authenticated;
grant all on public.site_visitors,public.analytics_geo_cache to service_role;
commit;
