-- LexiLoop MVP schema draft

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username::text ~ '^[a-z0-9_]{3,30}$')
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  icon text default 'book-open',
  color text default '#6366F1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  word text not null,
  meaning text not null,
  example text,
  note text,
  phonetic text,
  audio_url text,
  due_at timestamptz not null default now(),
  interval_days int not null default 0,
  correct_streak int not null default 0,
  review_count int not null default 0,
  forgot_count int not null default 0,
  remembered_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_count_consistency check (review_count = forgot_count + remembered_count),
  constraint positive_counts check (interval_days >= 0 and correct_streak >= 0 and review_count >= 0 and forgot_count >= 0 and remembered_count >= 0)
);

create unique index if not exists words_unique_word_per_deck on public.words(user_id, deck_id, lower(word));
create index if not exists words_due_idx on public.words(user_id, due_at);
create index if not exists words_deck_idx on public.words(deck_id);

create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  result text not null check (result in ('forgot', 'remembered')),
  reviewed_at timestamptz not null default now()
);

create index if not exists review_logs_user_reviewed_idx on public.review_logs(user_id, reviewed_at desc);

create table if not exists public.reminder_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  time time not null default '20:00',
  repeat_days int[] not null default array[0,1,2,3,4,5,6],
  message text not null default 'Time for your LexiLoop review.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repeat_days_valid check (repeat_days <@ array[0,1,2,3,4,5,6])
);

alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.words enable row level security;
alter table public.review_logs enable row level security;
alter table public.reminder_settings enable row level security;

create policy "profiles owner" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "decks owner" on public.decks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "words owner with owned deck" on public.words for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.decks d
      where d.id = deck_id and d.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.decks d
      where d.id = deck_id and d.user_id = (select auth.uid())
    )
  );

create policy "review logs owner" on public.review_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "reminder owner" on public.reminder_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function private.answer_word_review(p_word_id uuid, p_result text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_word public.words%rowtype;
  v_interval int;
begin
  if p_result not in ('forgot', 'remembered') then
    raise exception 'Invalid review result';
  end if;

  select * into v_word from public.words where id = p_word_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Word not found';
  end if;

  if p_result = 'forgot' then
    v_interval := 1;
    update public.words
    set correct_streak = 0,
        interval_days = v_interval,
        due_at = now() + make_interval(days => v_interval),
        review_count = review_count + 1,
        forgot_count = forgot_count + 1,
        updated_at = now()
    where id = p_word_id;
  else
    v_interval := case
      when v_word.correct_streak <= 0 then 2
      when v_word.correct_streak = 1 then 5
      when v_word.correct_streak = 2 then 10
      when v_word.correct_streak = 3 then 20
      else 30
    end;
    update public.words
    set correct_streak = correct_streak + 1,
        interval_days = v_interval,
        due_at = now() + make_interval(days => v_interval),
        review_count = review_count + 1,
        remembered_count = remembered_count + 1,
        updated_at = now()
    where id = p_word_id;
  end if;

  insert into public.review_logs(user_id, deck_id, word_id, result)
  values (auth.uid(), v_word.deck_id, v_word.id, p_result);

  return jsonb_build_object('ok', true, 'word_id', p_word_id, 'result', p_result, 'interval_days', v_interval);
end;
$$;

create or replace function public.answer_word_review(p_word_id uuid, p_result text)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.answer_word_review(p_word_id, p_result);
$$;
