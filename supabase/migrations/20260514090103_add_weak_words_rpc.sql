create or replace function private.get_weak_words(p_limit int default 10, p_deck_id uuid default null)
returns table (
  id uuid,
  user_id uuid,
  deck_id uuid,
  word text,
  meaning text,
  example text,
  note text,
  phonetic text,
  audio_url text,
  due_at timestamptz,
  interval_days int,
  correct_streak int,
  review_count int,
  forgot_count int,
  soon_count int,
  remembered_count int,
  created_at timestamptz,
  updated_at timestamptz,
  weak_score int,
  decks jsonb,
  word_examples jsonb
)
language sql
security definer
set search_path = public, private
as $$
  with normalized_input as (
    select least(greatest(coalesce(p_limit, 10), 1), 100) as row_limit
  ),
  scored_words as (
    select
      w.*,
      (
        (w.forgot_count * 3)
        + greatest(0, 5 - w.correct_streak)
        + case when w.due_at <= now() then 2 else 0 end
        + case
            when w.review_count > 0 and (w.remembered_count::numeric / w.review_count::numeric) < 0.7 then 1
            else 0
          end
      )::int as weak_score
    from public.words w
    where w.user_id = auth.uid()
      and w.review_count > 0
      and w.forgot_count > 0
      and (p_deck_id is null or w.deck_id = p_deck_id)
  ),
  ranked_words as (
    select
      sw.*,
      row_number() over (order by sw.weak_score desc, sw.due_at asc, sw.created_at asc) as weak_rank
    from scored_words sw
  )
  select
    rw.id,
    rw.user_id,
    rw.deck_id,
    rw.word,
    rw.meaning,
    rw.example,
    rw.note,
    rw.phonetic,
    rw.audio_url,
    rw.due_at,
    rw.interval_days,
    rw.correct_streak,
    rw.review_count,
    rw.forgot_count,
    rw.soon_count,
    rw.remembered_count,
    rw.created_at,
    rw.updated_at,
    rw.weak_score,
    to_jsonb(d.*) as decks,
    coalesce((
      select jsonb_agg(to_jsonb(we.*) order by we.sort_order asc)
      from public.word_examples we
      where we.word_id = rw.id
        and we.user_id = rw.user_id
    ), '[]'::jsonb) as word_examples
  from ranked_words rw
  join public.decks d
    on d.id = rw.deck_id
   and d.user_id = rw.user_id
  cross join normalized_input ni
  where rw.weak_rank <= ni.row_limit
  order by rw.weak_score desc, rw.due_at asc, rw.created_at asc;
$$;

create or replace function public.get_weak_words(p_limit int default 10, p_deck_id uuid default null)
returns table (
  id uuid,
  user_id uuid,
  deck_id uuid,
  word text,
  meaning text,
  example text,
  note text,
  phonetic text,
  audio_url text,
  due_at timestamptz,
  interval_days int,
  correct_streak int,
  review_count int,
  forgot_count int,
  soon_count int,
  remembered_count int,
  created_at timestamptz,
  updated_at timestamptz,
  weak_score int,
  decks jsonb,
  word_examples jsonb
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_weak_words(p_limit, p_deck_id);
$$;

revoke all on function private.get_weak_words(int, uuid) from public;
grant execute on function private.get_weak_words(int, uuid) to authenticated;

revoke all on function public.get_weak_words(int, uuid) from public;
grant execute on function public.get_weak_words(int, uuid) to authenticated;
