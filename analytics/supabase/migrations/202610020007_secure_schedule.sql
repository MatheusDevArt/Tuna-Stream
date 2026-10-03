begin;
-- Secrets enter as HTTPS RPC parameters from the trusted server, never SQL literals.
create or replace function public.analytics_configure_cron(cron_secret text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $function$
declare secret_id uuid; stored_secret text;
begin
 if length(cron_secret)<32 or length(cron_secret)>256 then raise exception 'invalid_secret'; end if;
 perform pg_advisory_xact_lock(hashtextextended('tunastream-cron-setup',0));
 select id,decrypted_secret into secret_id,stored_secret from vault.decrypted_secrets where name='tuna_cron_secret';
 if secret_id is null then
  perform vault.create_secret(cron_secret,'tuna_cron_secret','TunaStream scheduler authentication');
 elsif stored_secret<>cron_secret then
  perform vault.update_secret(secret_id,cron_secret);
 end if;
 perform cron.schedule('tunastream-minute-sync','* * * * *',$job$
  select net.http_post(
   url := 'https://tunastream-ofc.lovable.app/api/public/tuna-sync',
   headers := jsonb_build_object(
    'Content-Type','application/json',
    'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='tuna_cron_secret')
   ),
   body := '{}'::jsonb,
   timeout_milliseconds := 120000
  );
 $job$);
 return true;
end $function$;
revoke all on function public.analytics_configure_cron(text) from public,anon,authenticated;
grant execute on function public.analytics_configure_cron(text) to service_role;
commit;
