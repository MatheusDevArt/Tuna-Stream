alter table public.email_report_deliveries add column if not exists recipient_deliveries jsonb not null default '{}'::jsonb;
