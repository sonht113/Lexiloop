-- Hardening constraints and RPC permissions.

create unique index if not exists decks_unique_name_per_user
on public.decks(user_id, lower(name));

alter table public.reminder_settings
  drop constraint if exists repeat_days_valid;

alter table public.reminder_settings
  add constraint repeat_days_valid
  check (repeat_days <@ array[0,1,2,3,4,5,6] and cardinality(repeat_days) between 1 and 7);

create or replace function private.ensure_default_deck(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if p_user_id <> (select auth.uid()) then
    raise exception 'Not authorized';
  end if;

  insert into public.decks(user_id, name, description, icon, color)
  select p_user_id, 'Daily Life', 'Your default deck for everyday vocabulary.', 'book-open', '#6366F1'
  where not exists (
    select 1 from public.decks where user_id = p_user_id and lower(name) = lower('Daily Life')
  );
end;
$$;

create or replace function public.ensure_default_deck(p_user_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.ensure_default_deck(p_user_id);
$$;

grant usage on schema private to authenticated;

revoke all on function private.answer_word_review(uuid, text) from public;
grant execute on function private.answer_word_review(uuid, text) to authenticated;

revoke all on function public.answer_word_review(uuid, text) from public;
grant execute on function public.answer_word_review(uuid, text) to authenticated;

revoke all on function private.get_profile_stats() from public;
grant execute on function private.get_profile_stats() to authenticated;

revoke all on function public.get_profile_stats() from public;
grant execute on function public.get_profile_stats() to authenticated;

revoke all on function private.ensure_default_deck(uuid) from public;
grant execute on function private.ensure_default_deck(uuid) to authenticated;

revoke all on function public.ensure_default_deck(uuid) from public;
grant execute on function public.ensure_default_deck(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'decks'
    ) then
      alter publication supabase_realtime add table public.decks;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'words'
    ) then
      alter publication supabase_realtime add table public.words;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'review_logs'
    ) then
      alter publication supabase_realtime add table public.review_logs;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reminder_settings'
    ) then
      alter publication supabase_realtime add table public.reminder_settings;
    end if;
  end if;
end;
$$;
