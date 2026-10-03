begin;
alter table public.analytics_integrations add column first_success_at timestamptz;
update public.analytics_integrations set first_success_at=last_success_at where last_success_at is not null;
create function public.analytics_preserve_first_collection() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' then new.first_success_at:=coalesce(old.first_success_at,new.last_success_at);
 else new.first_success_at:=new.last_success_at; end if;
 return new;
end $$;
create trigger analytics_collection_started before insert or update on public.analytics_integrations for each row execute function public.analytics_preserve_first_collection();
revoke all on function public.analytics_preserve_first_collection() from public,anon,authenticated;
commit;
