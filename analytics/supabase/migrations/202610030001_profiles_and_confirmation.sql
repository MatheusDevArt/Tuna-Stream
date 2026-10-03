begin;
create table public.member_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 team_id uuid not null references public.teams(id) on delete cascade,
 display_name text not null check(length(display_name) between 3 and 60),
 default_avatar text not null check(default_avatar in ('matheus','adriana')),
 avatar_path text,
 recovery_email text,
 recovery_verified_at timestamptz,
 updated_at timestamptz not null default now()
);
insert into public.member_profiles(user_id,team_id,display_name,default_avatar)
 select user_id,team_id,case username when 'adriana s' then 'Adriana S' else 'Matheus P' end,
 case username when 'adriana s' then 'adriana' else 'matheus' end from public.analytics_users;
create table public.account_requests (
 token_hash text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 team_id uuid not null references public.teams(id) on delete cascade,
 kind text not null check(kind in ('email','username','password','instagram')),
 payload jsonb not null default '{}',
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '15 minutes'
);
create index account_requests_expiry_idx on public.account_requests(expires_at);
create table public.provider_credentials (
 team_id uuid not null references public.teams(id) on delete cascade,
 provider text not null check(provider='instagram'),
 account_id text not null,
 encrypted_token text not null,
 expires_at timestamptz not null,
 refreshed_at timestamptz not null default now(),
 primary key(team_id,provider)
);
alter table public.member_profiles enable row level security;
alter table public.account_requests enable row level security;
alter table public.provider_credentials enable row level security;
revoke all on public.member_profiles,public.account_requests,public.provider_credentials from anon,authenticated;
grant all on public.member_profiles,public.account_requests,public.provider_credentials to service_role;
-- Profiles are returned by the authenticated endpoint: teammates see names/photos,
-- while only the owner sees the recovery address. No direct client mutation.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('team-avatars','team-avatars',false,3145728,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
alter table public.site_opportunities add column selected_package text;
alter table public.site_opportunities add column identity_method text not null default 'phone'
 check(identity_method in ('phone','reference'));
update public.site_opportunities set selected_package=package;
alter table public.site_opportunities add constraint selected_package_valid
 check(selected_package in ('START','LIVE','STREAMER','COMBOS','CUSTOM','GENERAL'));

create function public.analytics_consume_request(digest_value text,expected_kind text,actor uuid default null)
returns setof public.account_requests language sql security definer set search_path=public,pg_temp as $$
 delete from public.account_requests where token_hash=digest_value and kind=expected_kind
 and expires_at>now() and (actor is null or user_id=actor) returning *;
$$;
revoke all on function public.analytics_consume_request(text,text,uuid) from public,anon,authenticated;
grant execute on function public.analytics_consume_request(text,text,uuid) to service_role;

create function public.analytics_confirm_link(reference_code text,tenant uuid,actor uuid,reference_digest text,requested boolean)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare intent public.whatsapp_intents; existing public.site_opportunities; result_id uuid;
begin
 if not exists(select 1 from public.team_members where user_id=actor and team_id=tenant) then raise exception 'access denied'; end if;
 select * into intent from public.whatsapp_intents where reference=reference_code and team_id=tenant for update;
 if not found or intent.ambiguous then raise exception 'invalid reference'; end if;
 select * into existing from public.site_opportunities where reference=reference_code and team_id=tenant and attributed limit 1;
 if found then result_id:=existing.id;
 else
  if intent.expires_at<now() then raise exception 'expired reference'; end if;
  perform public.analytics_receive(reference_code,reference_digest,reference_digest,now(),tenant);
  select id into result_id from public.site_opportunities where reference=reference_code and team_id=tenant and attributed;
  if result_id is null then raise exception 'invalid attribution'; end if;
  update public.site_opportunities set identity_method='reference',selected_package=package,
   confirmation_method='manual',confirmed_by=actor where id=result_id;
 end if;
 if requested and not exists(select 1 from public.site_opportunities where id=result_id and requested_at is not null) then
  perform public.analytics_change_stage(result_id,tenant,actor,'quote_requested');
 end if;
 return result_id;
end;
$$;
revoke all on function public.analytics_confirm_link(text,uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.analytics_confirm_link(text,uuid,uuid,text,boolean) to service_role;

-- Enrich a quick confirmation with a phone hash, preserving its ID and history.
-- Without this, using the original detailed form afterwards would falsely mark
-- the same reference ambiguous because its placeholder hash differs from a phone.
create function public.analytics_attach_contact(reference_code text,tenant uuid,actor uuid,contact_digest text,message_time timestamptz)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare intent public.whatsapp_intents; opportunity public.site_opportunities;
begin
 if not exists(select 1 from public.team_members where user_id=actor and team_id=tenant) then raise exception 'access denied'; end if;
 select * into intent from public.whatsapp_intents where reference=reference_code and team_id=tenant for update;
 if not found or intent.ambiguous or message_time>intent.expires_at or message_time<intent.created_at-interval '5 minutes' then raise exception 'invalid reference'; end if;
 select * into opportunity from public.site_opportunities where reference=reference_code and team_id=tenant and identity_method='reference' and attributed for update;
 if not found then return false; end if;
 update public.whatsapp_intents set claimed_contact=contact_digest where reference=reference_code;
 update public.site_opportunities set contact_hash=contact_digest,identity_method='phone',
  received_at=least(received_at,message_time),confirmed_by=actor where id=opportunity.id;
 return true;
end;
$$;
revoke all on function public.analytics_attach_contact(text,uuid,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.analytics_attach_contact(text,uuid,uuid,text,timestamptz) to service_role;

create function public.analytics_confirm_username(owner_id uuid,tenant uuid,nick text,display text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from public.team_members where user_id=owner_id and team_id=tenant) then raise exception 'access denied'; end if;
 update public.analytics_users set username=nick where user_id=owner_id and team_id=tenant;
 update public.member_profiles set display_name=display,updated_at=now() where user_id=owner_id and team_id=tenant;
end;
$$;
revoke all on function public.analytics_confirm_username(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.analytics_confirm_username(uuid,uuid,text,text) to service_role;
commit;
