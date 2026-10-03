begin;
create table public.email_report_deliveries(
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.teams(id) on delete cascade,
 period_start date not null, period_end date not null,
 kind text not null check(kind in ('test','weekly')),
 status text not null check(status in ('preparing','sending','sent','failed','uncertain')),
 provider_message_id text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(period_end>=period_start),
 unique(team_id,period_start,kind)
);
alter table public.email_report_deliveries enable row level security;
grant select on public.email_report_deliveries to authenticated;
grant all on public.email_report_deliveries to service_role;
revoke all on public.email_report_deliveries from anon;
create policy team_read on public.email_report_deliveries for select to authenticated using(exists(select 1 from public.team_members m where m.team_id=email_report_deliveries.team_id and m.user_id=(select auth.uid())));
alter table public.report_preferences add column email_reports_enabled boolean not null default false;
alter table public.report_preferences add column email_automation_id text;
update public.report_preferences set weekday=1,send_time='08:00:00',enabled=false;
commit;
