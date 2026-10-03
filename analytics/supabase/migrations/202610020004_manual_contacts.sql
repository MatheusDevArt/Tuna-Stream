begin;
alter table public.analytics_integrations add column mode text not null default 'api' check(mode in ('api','manual'));
alter table public.site_opportunities add column confirmation_method text not null default 'api' check(confirmation_method in ('api','manual'));
alter table public.site_opportunities add column confirmed_by uuid references auth.users(id);
do $$ declare tab text; begin
 foreach tab in array array['site_opportunities','report_preferences','report_deliveries','analytics_integrations'] loop
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=tab) then
   execute format('alter publication supabase_realtime add table public.%I',tab);
  end if;
 end loop;
end $$;
commit;
