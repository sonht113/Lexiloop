drop function if exists public.get_leaderboard(text, int);
drop function if exists private.get_leaderboard(text, int);

create or replace function private.get_leaderboard(p_metric text default 'mastered', p_period text default 'all_time', p_limit int default 50)
returns table (
  rank int,
  user_id uuid,
  username text,
  avatar_url text,
  total_words int,
  mastered_words int,
  total_reviews int,
  period_reviews int,
  period_start date,
  period_end date,
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
      case when p_period in ('all_time', 'week', 'month') then p_period else 'all_time' end as period,
      least(greatest(coalesce(p_limit, 50), 1), 100) as row_limit
  ),
  profile_windows as (
    select
      p.id as user_id,
      p.username,
      p.avatar_url,
      coalesce(nullif(p.timezone, ''), 'Asia/Ho_Chi_Minh') as timezone,
      ni.metric,
      ni.period,
      ni.row_limit,
      case
        when ni.period = 'week' then date_trunc('week', now() at time zone coalesce(nullif(p.timezone, ''), 'Asia/Ho_Chi_Minh'))::date
        when ni.period = 'month' then date_trunc('month', now() at time zone coalesce(nullif(p.timezone, ''), 'Asia/Ho_Chi_Minh'))::date
        else null::date
      end as period_start,
      case
        when ni.period = 'week' then (date_trunc('week', now() at time zone coalesce(nullif(p.timezone, ''), 'Asia/Ho_Chi_Minh'))::date + 6)
        when ni.period = 'month' then (date_trunc('month', now() at time zone coalesce(nullif(p.timezone, ''), 'Asia/Ho_Chi_Minh'))::date + interval '1 month - 1 day')::date
        else null::date
      end as period_end
    from public.profiles p
    cross join normalized_input ni
  ),
  user_stats as (
    select
      pw.user_id,
      pw.username,
      pw.avatar_url,
      pw.timezone,
      pw.metric,
      pw.period,
      pw.row_limit,
      pw.period_start,
      pw.period_end,
      count(distinct w.id)::int as total_words,
      count(distinct w.id) filter (where w.correct_streak >= 5)::int as mastered_words,
      count(distinct rl.id)::int as total_reviews,
      count(distinct rl.id) filter (
        where pw.period <> 'all_time'
          and (rl.reviewed_at at time zone pw.timezone)::date between pw.period_start and pw.period_end
      )::int as period_reviews
    from profile_windows pw
    left join public.words w
      on w.user_id = pw.user_id
    left join public.review_logs rl
      on rl.user_id = pw.user_id
    group by
      pw.user_id,
      pw.username,
      pw.avatar_url,
      pw.timezone,
      pw.metric,
      pw.period,
      pw.row_limit,
      pw.period_start,
      pw.period_end
  ),
  ranked as (
    select
      (row_number() over (
        order by
          case
            when us.period = 'all_time' and us.metric = 'mastered' then us.mastered_words
            when us.period = 'all_time' and us.metric = 'words' then us.total_words
            else us.period_reviews
          end desc,
          us.total_reviews desc,
          us.username asc
      ))::int as rank,
      us.user_id,
      us.username,
      us.avatar_url,
      us.total_words,
      us.mastered_words,
      us.total_reviews,
      us.period_reviews,
      us.period_start,
      us.period_end,
      private.get_user_current_streak(us.user_id, us.timezone) as current_streak,
      us.user_id = auth.uid() as is_current_user,
      us.row_limit
    from user_stats us
  )
  select
    ranked.rank,
    ranked.user_id,
    ranked.username,
    ranked.avatar_url,
    ranked.total_words,
    ranked.mastered_words,
    ranked.total_reviews,
    ranked.period_reviews,
    ranked.period_start,
    ranked.period_end,
    ranked.current_streak,
    ranked.is_current_user
  from ranked
  where ranked.rank <= ranked.row_limit
     or ranked.is_current_user
  order by ranked.rank asc;
$$;

create or replace function public.get_leaderboard(p_metric text default 'mastered', p_period text default 'all_time', p_limit int default 50)
returns table (
  rank int,
  user_id uuid,
  username text,
  avatar_url text,
  total_words int,
  mastered_words int,
  total_reviews int,
  period_reviews int,
  period_start date,
  period_end date,
  current_streak int,
  is_current_user boolean
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_leaderboard(p_metric, p_period, p_limit);
$$;

revoke all on function private.get_leaderboard(text, text, int) from public;
grant execute on function private.get_leaderboard(text, text, int) to authenticated;

revoke all on function public.get_leaderboard(text, text, int) from public;
grant execute on function public.get_leaderboard(text, text, int) to authenticated;
