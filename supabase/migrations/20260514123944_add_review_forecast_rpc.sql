create or replace function private.get_review_forecast()
returns table (
  period text,
  label text,
  review_count int,
  start_date date,
  end_date date
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid;
  v_timezone text;
  v_today date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.timezone
  into v_timezone
  from public.profiles p
  where p.id = v_user_id;

  v_timezone := coalesce(nullif(v_timezone, ''), 'Asia/Ho_Chi_Minh');
  v_today := (now() at time zone v_timezone)::date;

  return query
  with forecast_buckets as (
    select 'today'::text as period, 'Today'::text as label, v_today as start_date, v_today as end_date, 1 as sort_order
    union all
    select 'tomorrow'::text, 'Tomorrow'::text, v_today + 1, v_today + 1, 2
    union all
    select 'next_7_days'::text, 'Next 7 days'::text, v_today + 2, v_today + 7, 3
  )
  select
    fb.period,
    fb.label,
    count(w.id)::int as review_count,
    fb.start_date,
    fb.end_date
  from forecast_buckets fb
  left join public.words w
    on w.user_id = v_user_id
   and w.review_count > 0
   and (w.due_at at time zone v_timezone)::date between fb.start_date and fb.end_date
  group by fb.period, fb.label, fb.start_date, fb.end_date, fb.sort_order
  order by fb.sort_order;
end;
$$;

create or replace function public.get_review_forecast()
returns table (
  period text,
  label text,
  review_count int,
  start_date date,
  end_date date
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.get_review_forecast();
$$;

revoke all on function private.get_review_forecast() from public;
grant execute on function private.get_review_forecast() to authenticated;

revoke all on function public.get_review_forecast() from public;
grant execute on function public.get_review_forecast() to authenticated;
