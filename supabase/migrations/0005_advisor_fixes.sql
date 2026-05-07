-- Advisor fixes after initial Supabase migration.

alter extension citext set schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create index if not exists review_logs_deck_idx
on public.review_logs(deck_id);

create index if not exists review_logs_word_idx
on public.review_logs(word_id);
