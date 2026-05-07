
-- Bootstrap profile, reminder settings, and default deck after signup.
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

  insert into public.decks(user_id, name, description, icon, color)
  values (new.id, 'Daily Life', 'Your default deck for everyday vocabulary.', 'book-open', '#6366F1')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Updated-at helper.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists decks_set_updated_at on public.decks;
create trigger decks_set_updated_at before update on public.decks for each row execute function public.set_updated_at();

drop trigger if exists words_set_updated_at on public.words;
create trigger words_set_updated_at before update on public.words for each row execute function public.set_updated_at();

drop trigger if exists reminder_settings_set_updated_at on public.reminder_settings;
create trigger reminder_settings_set_updated_at before update on public.reminder_settings for each row execute function public.set_updated_at();
