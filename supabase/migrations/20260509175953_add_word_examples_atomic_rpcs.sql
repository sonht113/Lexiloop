-- Atomic word mutations keep words and word_examples in sync.
create or replace function private.create_word_with_examples(p_input jsonb)
returns public.words
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_deck_id uuid := (p_input ->> 'deck_id')::uuid;
  v_word text := btrim(coalesce(p_input ->> 'word', ''));
  v_meaning text := btrim(coalesce(p_input ->> 'meaning', ''));
  v_examples jsonb := coalesce(p_input -> 'examples', '[]'::jsonb);
  v_first_example text;
  v_created_word public.words%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from public.decks where id = v_deck_id and user_id = v_user_id) then
    raise exception 'Deck not found';
  end if;

  if v_word = '' or v_meaning = '' then
    raise exception 'Word and meaning are required';
  end if;

  select btrim(value ->> 'sentence')
  into v_first_example
  from jsonb_array_elements(v_examples) with ordinality as item(value, position)
  where btrim(coalesce(value ->> 'sentence', '')) <> ''
  order by position
  limit 1;

  insert into public.words(user_id, deck_id, word, meaning, example, note, phonetic, audio_url)
  values (
    v_user_id,
    v_deck_id,
    v_word,
    v_meaning,
    nullif(v_first_example, ''),
    nullif(btrim(coalesce(p_input ->> 'note', '')), ''),
    nullif(btrim(coalesce(p_input ->> 'phonetic', '')), ''),
    nullif(btrim(coalesce(p_input ->> 'audio_url', '')), '')
  )
  returning * into v_created_word;

  insert into public.word_examples(user_id, word_id, sentence, translation, sort_order)
  select
    v_user_id,
    v_created_word.id,
    normalized.sentence,
    normalized.translation,
    normalized.sort_order
  from (
    select
      btrim(value ->> 'sentence') as sentence,
      nullif(btrim(coalesce(value ->> 'translation', '')), '') as translation,
      row_number() over (order by position)::int - 1 as sort_order
    from jsonb_array_elements(v_examples) with ordinality as item(value, position)
    where btrim(coalesce(value ->> 'sentence', '')) <> ''
    order by position
    limit 3
  ) as normalized;

  return v_created_word;
end;
$$;

create or replace function public.create_word_with_examples(p_input jsonb)
returns public.words
language sql
security invoker
set search_path = ''
as $$
  select * from private.create_word_with_examples(p_input);
$$;

create or replace function private.update_word_with_examples(p_word_id uuid, p_input jsonb)
returns public.words
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_deck_id uuid := (p_input ->> 'deck_id')::uuid;
  v_word text := btrim(coalesce(p_input ->> 'word', ''));
  v_meaning text := btrim(coalesce(p_input ->> 'meaning', ''));
  v_examples jsonb := coalesce(p_input -> 'examples', '[]'::jsonb);
  v_first_example text;
  v_updated_word public.words%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from public.words where id = p_word_id and user_id = v_user_id) then
    raise exception 'Word not found';
  end if;

  if not exists (select 1 from public.decks where id = v_deck_id and user_id = v_user_id) then
    raise exception 'Deck not found';
  end if;

  if v_word = '' or v_meaning = '' then
    raise exception 'Word and meaning are required';
  end if;

  select btrim(value ->> 'sentence')
  into v_first_example
  from jsonb_array_elements(v_examples) with ordinality as item(value, position)
  where btrim(coalesce(value ->> 'sentence', '')) <> ''
  order by position
  limit 1;

  update public.words
  set deck_id = v_deck_id,
      word = v_word,
      meaning = v_meaning,
      example = nullif(v_first_example, ''),
      note = nullif(btrim(coalesce(p_input ->> 'note', '')), ''),
      phonetic = nullif(btrim(coalesce(p_input ->> 'phonetic', '')), ''),
      audio_url = nullif(btrim(coalesce(p_input ->> 'audio_url', '')), ''),
      updated_at = now()
  where id = p_word_id and user_id = v_user_id
  returning * into v_updated_word;

  delete from public.word_examples
  where word_id = p_word_id and user_id = v_user_id;

  insert into public.word_examples(user_id, word_id, sentence, translation, sort_order)
  select
    v_user_id,
    p_word_id,
    normalized.sentence,
    normalized.translation,
    normalized.sort_order
  from (
    select
      btrim(value ->> 'sentence') as sentence,
      nullif(btrim(coalesce(value ->> 'translation', '')), '') as translation,
      row_number() over (order by position)::int - 1 as sort_order
    from jsonb_array_elements(v_examples) with ordinality as item(value, position)
    where btrim(coalesce(value ->> 'sentence', '')) <> ''
    order by position
    limit 3
  ) as normalized;

  return v_updated_word;
end;
$$;

create or replace function public.update_word_with_examples(p_word_id uuid, p_input jsonb)
returns public.words
language sql
security invoker
set search_path = ''
as $$
  select * from private.update_word_with_examples(p_word_id, p_input);
$$;

revoke all on function private.create_word_with_examples(jsonb) from public;
grant execute on function private.create_word_with_examples(jsonb) to authenticated;

revoke all on function public.create_word_with_examples(jsonb) from public;
grant execute on function public.create_word_with_examples(jsonb) to authenticated;

revoke all on function private.update_word_with_examples(uuid, jsonb) from public;
grant execute on function private.update_word_with_examples(uuid, jsonb) to authenticated;

revoke all on function public.update_word_with_examples(uuid, jsonb) from public;
grant execute on function public.update_word_with_examples(uuid, jsonb) to authenticated;
