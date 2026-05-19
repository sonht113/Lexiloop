drop policy if exists "reminder push delivery log owner read" on public.reminder_push_delivery_log;
create policy "reminder push delivery log owner read" on public.reminder_push_delivery_log
  for select to authenticated
  using (user_id = (select auth.uid()));
