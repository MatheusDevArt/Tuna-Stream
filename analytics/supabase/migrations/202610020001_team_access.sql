begin;
create table public.teams (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 created_at timestamptz not null default now()
);
create table public.team_members (
 team_id uuid not null references public.teams(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 primary key (team_id,user_id)
);
create index team_members_user_team_idx on public.team_members(user_id,team_id);
create table public.analytics_snapshots (
 team_id uuid not null references public.teams(id) on delete cascade,
 period_start date not null,
 period_end date not null check(period_end>=period_start),
 current_metrics jsonb not null check(jsonb_typeof(current_metrics)='object'),
 previous_metrics jsonb not null check(jsonb_typeof(previous_metrics)='object'),
 updated_at timestamptz not null default now(),
 primary key(team_id,period_start,period_end)
);
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.analytics_snapshots enable row level security;
revoke all on public.teams,public.team_members,public.analytics_snapshots from anon,authenticated;
grant select on public.teams,public.team_members,public.analytics_snapshots to authenticated;
create policy members_read_self on public.team_members for select to authenticated using(user_id=(select auth.uid()));
create policy teams_read_members on public.teams for select to authenticated using(exists(select 1 from public.team_members m where m.team_id=teams.id and m.user_id=(select auth.uid())));
create policy metrics_read_members on public.analytics_snapshots for select to authenticated using(exists(select 1 from public.team_members m where m.team_id=analytics_snapshots.team_id and m.user_id=(select auth.uid())));
-- No client insert/update/delete policies: only the trusted server writes metrics and memberships.
do $$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and
 not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='analytics_snapshots') then
   alter publication supabase_realtime add table public.analytics_snapshots;
 end if;
end $$;
commit;
