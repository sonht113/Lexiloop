create table if not exists public.learning_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_new_words_limit int not null default 5,
  daily_weak_words_limit int not null default 10,
  daily_review_target int not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_settings_daily_new_words_limit_range
    check (daily_new_words_limit between 1 and 50),
  constraint learning_settings_daily_weak_words_limit_range
    check (daily_weak_words_limit between 1 and 100),
  constraint learning_settings_daily_review_target_range
    check (daily_review_target between 1 and 200)
);

alter table public.learning_settings enable row level security;

drop policy if exists "learning settings owner" on public.learning_settings;
create policy "learning settings owner" on public.learning_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop trigger if exists learning_settings_set_updated_at on public.learning_settings;
create trigger learning_settings_set_updated_at
  before update on public.learning_settings
  for each row execute function public.set_updated_at();

insert into public.learning_settings(user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_username text;
begin
  v_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))));

  insert into public.profiles(id, username)
  values (new.id, v_username)
  on conflict (id) do nothing;

  insert into public.reminder_settings(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.learning_settings(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.decks(user_id, name, description, icon, color)
  values (new.id, 'Daily Life', 'Your default deck for everyday vocabulary.', 'book-open', '#6366F1')
  on conflict do nothing;

  return new;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'learning_settings'
    ) then
      alter publication supabase_realtime add table public.learning_settings;
    end if;
  end if;
end;
$$;
