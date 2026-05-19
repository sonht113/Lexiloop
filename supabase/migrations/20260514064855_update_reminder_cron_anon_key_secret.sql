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
