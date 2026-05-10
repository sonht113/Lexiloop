create table if not exists public.word_examples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  sentence text not null,
  translation text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint word_examples_sentence_not_blank check (length(btrim(sentence)) > 0),
  constraint word_examples_sort_order_valid check (sort_order >= 0 and sort_order <= 2)
);

create unique index if not exists word_examples_word_sort_order_idx
on public.word_examples(word_id, sort_order);

create index if not exists word_examples_user_word_idx
on public.word_examples(user_id, word_id, sort_order);

drop trigger if exists word_examples_set_updated_at on public.word_examples;
create trigger word_examples_set_updated_at
  before update on public.word_examples
  for each row execute function public.set_updated_at();

alter table public.word_examples enable row level security;

create policy "word examples owner select" on public.word_examples
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "word examples owner insert" on public.word_examples
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.words
      where words.id = word_examples.word_id
        and words.user_id = (select auth.uid())
    )
  );

create policy "word examples owner update" on public.word_examples
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.words
      where words.id = word_examples.word_id
        and words.user_id = (select auth.uid())
    )
  );

create policy "word examples owner delete" on public.word_examples
  for delete to authenticated
  using (user_id = (select auth.uid()));

insert into public.word_examples(user_id, word_id, sentence, sort_order)
select user_id, id, btrim(example), 0
from public.words
where example is not null
  and length(btrim(example)) > 0
on conflict (word_id, sort_order) do nothing;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'word_examples'
    ) then
      alter publication supabase_realtime add table public.word_examples;
    end if;
  end if;
end;
$$;
