begin;
create or replace function public.analytics_set_instagram_runtime(settings jsonb) returns void
 language plpgsql security definer set search_path='' as $$
declare secret_id uuid; old_settings jsonb; tenant uuid;
begin
 if jsonb_typeof(settings) is distinct from 'object'
 or (select count(*) from jsonb_object_keys(settings))<>6
 or not (settings ?& array['TUNA_TEAM_ID','META_GRAPH_VERSION','INSTAGRAM_TOKEN_ENCRYPTION_KEY','INSTAGRAM_CRON_SECRET','TUNA_RATE_SECRET','TUNA_PANEL_URL'])
 or exists(select 1 from jsonb_each(settings) e where jsonb_typeof(e.value) is distinct from 'string')
 or settings->>'META_GRAPH_VERSION' !~ '^v[0-9]+\.[0-9]+$'
 or settings->>'INSTAGRAM_TOKEN_ENCRYPTION_KEY' !~ '^[a-f0-9]{64}$'
 or length(settings->>'INSTAGRAM_CRON_SECRET')<32
 or length(settings->>'TUNA_RATE_SECRET')<32
 or settings->>'TUNA_PANEL_URL' !~ '^https?://' then raise exception 'invalid_settings'; end if;
 tenant:=(settings->>'TUNA_TEAM_ID')::uuid;
 if tenant is null or not exists(select 1 from public.teams where id=tenant) then raise exception 'invalid_settings'; end if;
 select id,decrypted_secret::jsonb into secret_id,old_settings from vault.decrypted_secrets where name='tuna_instagram_runtime';
 if exists(select 1 from public.provider_credentials where team_id=tenant and provider='instagram')
 and old_settings->>'INSTAGRAM_TOKEN_ENCRYPTION_KEY' is distinct from settings->>'INSTAGRAM_TOKEN_ENCRYPTION_KEY'
 then raise exception 'credential_key_change_denied'; end if;
 if secret_id is null then perform vault.create_secret(settings::text,'tuna_instagram_runtime','Private Instagram collector configuration');
 else perform vault.update_secret(secret_id,settings::text); end if;
end $$;

revoke all on function public.analytics_set_instagram_runtime(jsonb) from public,anon,authenticated;
grant execute on function public.analytics_set_instagram_runtime(jsonb) to service_role;
commit;
