begin;
create table public.instagram_periods (
 team_id uuid not null references public.teams(id) on delete cascade,
 period_start date not null,
 period_end date not null,
 metrics jsonb not null,
 collected_at timestamptz not null default now(),
 primary key(team_id,period_start,period_end)
);
alter table public.instagram_periods enable row level security;
revoke all on public.instagram_periods from anon,authenticated;
grant all on public.instagram_periods,public.analytics_users,public.site_sessions,public.site_events,public.whatsapp_intents,public.site_opportunities,public.opportunity_history,public.whatsapp_receipts,public.analytics_integrations,public.instagram_daily,public.instagram_media,public.report_preferences,public.report_deliveries,public.analytics_rate_limits to service_role;
grant usage,select on all sequences in schema public to service_role;
commit;
