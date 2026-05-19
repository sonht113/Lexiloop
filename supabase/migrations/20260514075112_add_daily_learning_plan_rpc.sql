create or replace function private.get_daily_learning_plan()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid;
  v_username text;
  v_timezone text;
  v_today date;
  v_daily_new_words_limit int;
  v_daily_weak_words_limit int;
  v_daily_review_target int;
  v_due_count int;
  v_available_new_words int;
  v_available_weak_words int;
  v_reviewed_today int;
  v_total_words int;
  v_mastered_words int;
  v_current_streak int := 0;
  v_cursor_date date;
  v_has_day boolean;
  v_remaining_today int;
  v_completion_percent int;
  v_next_recommended_action text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.username::text, p.timezone
  into v_username, v_timezone
  from public.profiles p
  where p.id = v_user_id;

  v_username := coalesce(nullif(v_username, ''), 'Learner');
  v_timezone := coalesce(nullif(v_timezone, ''), 'Asia/Ho_Chi_Minh');
  v_today := (now() at time zone v_timezone)::date;

  select
    coalesce(ls.daily_new_words_limit, 5),
    coalesce(ls.daily_weak_words_limit, 10),
    coalesce(ls.daily_review_target, 20)
  into
    v_daily_new_words_limit,
    v_daily_weak_words_limit,
    v_daily_review_target
  from (select v_user_id as user_id) current_user_row
  left join public.learning_settings ls
    on ls.user_id = current_user_row.user_id;

  select count(*)::int
  into v_due_count
  from public.words w
  where w.user_id = v_user_id
    and w.review_count > 0
    and w.due_at <= now();

  select least(count(*)::int, v_daily_new_words_limit)
  into v_available_new_words
  from public.words w
  where w.user_id = v_user_id
    and w.review_count = 0;

  select least(count(*)::int, v_daily_weak_words_limit)
  into v_available_weak_words
  from public.words w
  where w.user_id = v_user_id
    and w.review_count > 0
    and w.forgot_count > 0
    and w.due_at <= now();

  select count(*)::int
  into v_reviewed_today
  from public.review_logs rl
  where rl.user_id = v_user_id
    and (rl.reviewed_at at time zone v_timezone)::date = v_today;

  select count(*)::int
  into v_total_words
  from public.words w
  where w.user_id = v_user_id;

  select count(*)::int
  into v_mastered_words
  from public.words w
  where w.user_id = v_user_id
    and w.correct_streak >= 5;

  v_cursor_date := v_today;
  loop
    select exists(
      select 1
      from public.review_logs rl
      where rl.user_id = v_user_id
        and (rl.reviewed_at at time zone v_timezone)::date = v_cursor_date
    )
    into v_has_day;

    exit when not v_has_day;
    v_current_streak := v_current_streak + 1;
    v_cursor_date := v_cursor_date - interval '1 day';
  end loop;

  v_remaining_today := v_due_count + v_available_new_words + v_available_weak_words;
  v_completion_percent := least(
    100,
    round((v_reviewed_today::numeric / greatest(v_daily_review_target, 1)::numeric) * 100)::int
  );

  v_next_recommended_action := case
    when v_due_count > 0 then 'review_due'
    when v_available_new_words > 0 then 'learn_new'
    when v_available_weak_words > 0 then 'practice_weak'
    else 'done'
  end;

  return jsonb_build_object(
    'username', v_username,
    'due_count', v_due_count,
    'available_new_words', v_available_new_words,
    'available_weak_words', v_available_weak_words,
    'daily_new_words_limit', v_daily_new_words_limit,
    'daily_weak_words_limit', v_daily_weak_words_limit,
    'daily_review_target', v_daily_review_target,
    'reviewed_today', v_reviewed_today,
    'total_words', v_total_words,
    'mastered_words', v_mastered_words,
    'current_streak', v_current_streak,
    'remaining_today', v_remaining_today,
    'completion_percent', v_completion_percent,
    'next_recommended_action', v_next_recommended_action
  );
end;
$$;

create or replace function public.get_daily_learning_plan()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_daily_learning_plan();
$$;

revoke all on function private.get_daily_learning_plan() from public;
grant execute on function private.get_daily_learning_plan() to authenticated;

revoke all on function public.get_daily_learning_plan() from public;
grant execute on function public.get_daily_learning_plan() to authenticated;
