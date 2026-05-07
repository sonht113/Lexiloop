-- Stats and streak helper functions for LexiLoop MVP.

create or replace function public.get_profile_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_words int;
  v_mastered_words int;
  v_total_reviews int;
  v_remembered_reviews int;
  v_accuracy int;
  v_timezone text;
  v_streak int := 0;
  v_cursor_date date;
  v_has_day boolean;
begin
  select timezone into v_timezone from public.profiles where id = auth.uid();
  v_timezone := coalesce(v_timezone, 'Asia/Ho_Chi_Minh');

  select count(*) into v_total_words from public.words where user_id = auth.uid();
  select count(*) into v_mastered_words from public.words where user_id = auth.uid() and correct_streak >= 5;
  select count(*) into v_total_reviews from public.review_logs where user_id = auth.uid();
  select count(*) into v_remembered_reviews from public.review_logs where user_id = auth.uid() and result = 'remembered';

  v_accuracy := case when v_total_reviews = 0 then null else round((v_remembered_reviews::numeric / v_total_reviews::numeric) * 100)::int end;

  v_cursor_date := (now() at time zone v_timezone)::date;

  loop
    select exists(
      select 1 from public.review_logs
      where user_id = auth.uid()
        and (reviewed_at at time zone v_timezone)::date = v_cursor_date
    ) into v_has_day;

    exit when not v_has_day;
    v_streak := v_streak + 1;
    v_cursor_date := v_cursor_date - interval '1 day';
  end loop;

  return jsonb_build_object(
    'total_words', v_total_words,
    'mastered_words', v_mastered_words,
    'total_reviews', v_total_reviews,
    'accuracy', v_accuracy,
    'current_streak', v_streak
  );
end;
$$;
