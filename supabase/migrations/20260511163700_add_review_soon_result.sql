-- Add a middle review outcome for words that are remembered weakly.
-- "soon" updates SRS scheduling without counting as a full remembered review.

alter table public.words
  add column if not exists soon_count int not null default 0;

alter table public.words
  drop constraint if exists review_count_consistency;

alter table public.words
  drop constraint if exists positive_counts;

alter table public.words
  add constraint review_count_consistency
  check (review_count = forgot_count + soon_count + remembered_count);

alter table public.words
  add constraint positive_counts
  check (
    interval_days >= 0
    and correct_streak >= 0
    and review_count >= 0
    and forgot_count >= 0
    and soon_count >= 0
    and remembered_count >= 0
  );

alter table public.review_logs
  drop constraint if exists review_logs_result_check;

alter table public.review_logs
  add constraint review_logs_result_check
  check (result in ('forgot', 'soon', 'remembered'));

create or replace function private.answer_word_review(p_word_id uuid, p_result text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_word public.words%rowtype;
  v_interval int;
  v_previous_correct_streak int;
  v_next_correct_streak int;
  v_was_mastered boolean;
  v_is_mastered boolean;
begin
  if p_result not in ('forgot', 'soon', 'remembered') then
    raise exception 'Invalid review result';
  end if;

  select * into v_word from public.words where id = p_word_id and user_id = auth.uid() for update;
  if not found then
    raise exception 'Word not found';
  end if;

  v_previous_correct_streak := v_word.correct_streak;
  v_was_mastered := v_previous_correct_streak >= 5;

  if p_result = 'forgot' then
    v_interval := 1;
    v_next_correct_streak := 0;

    update public.words
    set correct_streak = v_next_correct_streak,
        interval_days = v_interval,
        due_at = now() + make_interval(days => v_interval),
        review_count = review_count + 1,
        forgot_count = forgot_count + 1,
        updated_at = now()
    where id = p_word_id;
  elsif p_result = 'soon' then
    v_interval := 3;
    v_next_correct_streak := v_previous_correct_streak;

    update public.words
    set correct_streak = v_next_correct_streak,
        interval_days = v_interval,
        due_at = now() + make_interval(days => v_interval),
        review_count = review_count + 1,
        soon_count = soon_count + 1,
        updated_at = now()
    where id = p_word_id;
  else
    v_interval := case
      when v_previous_correct_streak <= 0 then 2
      when v_previous_correct_streak = 1 then 5
      when v_previous_correct_streak = 2 then 10
      when v_previous_correct_streak = 3 then 20
      when v_previous_correct_streak = 4 then 30
      when v_previous_correct_streak = 5 then 60
      else 90
    end;
    v_next_correct_streak := v_previous_correct_streak + 1;

    update public.words
    set correct_streak = v_next_correct_streak,
        interval_days = v_interval,
        due_at = now() + make_interval(days => v_interval),
        review_count = review_count + 1,
        remembered_count = remembered_count + 1,
        updated_at = now()
    where id = p_word_id;
  end if;

  v_is_mastered := v_next_correct_streak >= 5;

  insert into public.review_logs(user_id, deck_id, word_id, result)
  values (auth.uid(), v_word.deck_id, v_word.id, p_result);

  return jsonb_build_object(
    'ok', true,
    'word_id', p_word_id,
    'result', p_result,
    'interval_days', v_interval,
    'previous_correct_streak', v_previous_correct_streak,
    'correct_streak', v_next_correct_streak,
    'was_mastered', v_was_mastered,
    'is_mastered', v_is_mastered,
    'newly_mastered', (not v_was_mastered and v_is_mastered)
  );
end;
$$;
