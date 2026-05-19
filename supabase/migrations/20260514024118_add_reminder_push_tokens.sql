create table if not exists public.reminder_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('android', 'ios', 'web', 'unknown')),
  device_id text,
  enabled boolean not null default true,
  last_registered_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reminder_push_tokens_user_token_idx
on public.reminder_push_tokens(user_id, token);

create index if not exists reminder_push_tokens_user_enabled_idx
on public.reminder_push_tokens(user_id, enabled);

create table if not exists public.reminder_push_delivery_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_date date not null,
  reminder_time time not null,
  status text not null default 'processing' check (status in ('processing', 'sent', 'failed')),
  sent_count int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, reminder_date, reminder_time)
);

alter table public.reminder_push_tokens enable row level security;
alter table public.reminder_push_delivery_log enable row level security;

create extension if not exists pg_net;
create extension if not exists pg_cron;

drop policy if exists "reminder push tokens owner" on public.reminder_push_tokens;
create policy "reminder push tokens owner" on public.reminder_push_tokens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop trigger if exists reminder_push_tokens_set_updated_at on public.reminder_push_tokens;
create trigger reminder_push_tokens_set_updated_at
  before update on public.reminder_push_tokens
  for each row execute function public.set_updated_at();

drop trigger if exists reminder_push_delivery_log_set_updated_at on public.reminder_push_delivery_log;
create trigger reminder_push_delivery_log_set_updated_at
  before update on public.reminder_push_delivery_log
  for each row execute function public.set_updated_at();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reminder_push_tokens'
    ) then
      alter publication supabase_realtime add table public.reminder_push_tokens;
    end if;
  end if;
end;
$$;

create or replace function private.schedule_reminder_push_cron()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform "cron"."schedule"(
    'lexiloop-send-reminders',
    '* * * * *',
    $job$
    select
      "net"."http_post"(
        url := (select decrypted_secret from "vault"."decrypted_secrets" where name = 'EXPO_PUBLIC_SUPABASE_URL') || '/functions/v1/send-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from "vault"."decrypted_secrets" where name = 'SUPABASE_LEGACY_ANON_KEY'),
          'x-lexiloop-cron-secret', (select decrypted_secret from "vault"."decrypted_secrets" where name = 'REMINDER_CRON_SECRET')
        ),
        body := jsonb_build_object('time', now()),
        timeout_milliseconds := 5000
      );
    $job$
  );
end;
$$;
