-- Deck list stats for the Decks screen.

create or replace function private.get_decks_with_stats()
returns table (
  id uuid,
  user_id uuid,
  name text,
  description text,
  icon text,
  color text,
  created_at timestamptz,
  updated_at timestamptz,
  word_count int,
  due_count int,
  mastered_count int,
  mastery_percent int
)
language sql
security definer
set search_path = public, private
as $$
  select
    d.id,
    d.user_id,
    d.name,
    d.description,
    d.icon,
    d.color,
    d.created_at,
    d.updated_at,
    count(w.id)::int as word_count,
    count(w.id) filter (where w.due_at <= now())::int as due_count,
    count(w.id) filter (where w.correct_streak >= 5)::int as mastered_count,
    case
      when count(w.id) = 0 then 0
      else round((count(w.id) filter (where w.correct_streak >= 5))::numeric / count(w.id)::numeric * 100)::int
    end as mastery_percent
  from public.decks d
  left join public.words w
    on w.deck_id = d.id
   and w.user_id = d.user_id
  where d.user_id = auth.uid()
  group by d.id
  order by d.created_at asc;
$$;

create or replace function public.get_decks_with_stats()
returns table (
  id uuid,
  user_id uuid,
  name text,
  description text,
  icon text,
  color text,
  created_at timestamptz,
  updated_at timestamptz,
  word_count int,
  due_count int,
  mastered_count int,
  mastery_percent int
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_decks_with_stats();
$$;

revoke all on function private.get_decks_with_stats() from public;
grant execute on function private.get_decks_with_stats() to authenticated;

revoke all on function public.get_decks_with_stats() from public;
grant execute on function public.get_decks_with_stats() to authenticated;
