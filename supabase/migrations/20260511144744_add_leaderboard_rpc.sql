-- Public aggregate leaderboard for authenticated users.
-- Returns user-level stats only; word and deck contents remain protected by RLS.

create or replace function private.get_user_current_streak(p_user_id uuid, p_timezone text)
returns int
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_day date;
  v_streak int := 0;
begin
  v_day := (now() at time zone coalesce(nullif(p_timezone, ''), 'UTC'))::date;

  loop
    exit when not exists (
      select 1
      from public.review_logs rl
      where rl.user_id = p_user_id
        and (rl.reviewed_at at time zone coalesce(nullif(p_timezone, ''), 'UTC'))::date = v_day
    );

    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;

  return v_streak;
end;
$$;

create or replace function private.get_leaderboard(p_metric text default 'mastered', p_limit int default 50)
returns table (
  rank int,
  user_id uuid,
  username text,
  avatar_url text,
  total_words int,
  mastered_words int,
  total_reviews int,
  current_streak int,
  is_current_user boolean
)
language sql
security definer
set search_path = public, private
as $$
  with normalized_input as (
    select
      case when p_metric in ('mastered', 'words') then p_metric else 'mastered' end as metric,
      least(greatest(coalesce(p_limit, 50), 1), 100) as row_limit
  ),
  user_stats as (
    select
      p.id as user_id,
      p.username,
      p.avatar_url,
      p.timezone,
      count(distinct w.id)::int as total_words,
      count(distinct w.id) filter (where w.correct_streak >= 5)::int as mastered_words,
      count(distinct rl.id)::int as total_reviews
    from public.profiles p
    left join public.words w
      on w.user_id = p.id
    left join public.review_logs rl
      on rl.user_id = p.id
    group by p.id, p.username, p.avatar_url, p.timezone
  ),
  ranked as (
    select
      (row_number() over (
        order by
          case when ni.metric = 'mastered' then us.mastered_words else us.total_words end desc,
          us.total_reviews desc,
          us.username asc
      ))::int as rank,
      us.user_id,
      us.username,
      us.avatar_url,
      us.total_words,
      us.mastered_words,
      us.total_reviews,
      private.get_user_current_streak(us.user_id, us.timezone) as current_streak,
      us.user_id = auth.uid() as is_current_user,
      ni.row_limit
    from user_stats us
    cross join normalized_input ni
  )
  select
    ranked.rank,
    ranked.user_id,
    ranked.username,
    ranked.avatar_url,
    ranked.total_words,
    ranked.mastered_words,
    ranked.total_reviews,
    ranked.current_streak,
    ranked.is_current_user
  from ranked
  where ranked.rank <= ranked.row_limit
     or ranked.is_current_user
  order by ranked.rank asc;
$$;

create or replace function public.get_leaderboard(p_metric text default 'mastered', p_limit int default 50)
returns table (
  rank int,
  user_id uuid,
  username text,
  avatar_url text,
  total_words int,
  mastered_words int,
  total_reviews int,
  current_streak int,
  is_current_user boolean
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_leaderboard(p_metric, p_limit);
$$;

revoke all on function private.get_user_current_streak(uuid, text) from public;
grant execute on function private.get_user_current_streak(uuid, text) to authenticated;

revoke all on function private.get_leaderboard(text, int) from public;
grant execute on function private.get_leaderboard(text, int) to authenticated;

revoke all on function public.get_leaderboard(text, int) from public;
grant execute on function public.get_leaderboard(text, int) to authenticated;
