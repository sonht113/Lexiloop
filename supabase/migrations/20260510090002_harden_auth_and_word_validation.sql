-- Harden signup bootstrap and atomic word mutation validation.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_metadata_username text;
  v_email_username text;
  v_username text;
  v_fallback_username text;
begin
  v_metadata_username := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  v_email_username := lower(btrim(coalesce(split_part(new.email, '@', 1), '')));
  v_fallback_username := 'user_' || replace(new.id::text, '-', '')::text;
  v_fallback_username := left(v_fallback_username, 30);
  v_username := coalesce(nullif(v_metadata_username, ''), nullif(v_email_username, ''), v_fallback_username);

  if v_username !~ '^[a-z0-9_]{3,30}$'
    or exists (
      select 1
      from public.profiles
      where username = v_username
        and id <> new.id
    )
  then
    v_username := v_fallback_username;
  end if;

  insert into public.profiles(id, username)
  values (new.id, v_username)
  on conflict (id) do nothing;

  insert into public.reminder_settings(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.decks(user_id, name, description, icon, color)
  values (new.id, 'Daily Life', 'Your default deck for everyday vocabulary.', 'book-open', '#6366F1')
  on conflict do nothing;

  return new;
end;
$$;

create or replace function private.create_word_with_examples(p_input jsonb)
returns public.words
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_deck_id uuid;
  v_word text := btrim(coalesce(p_input ->> 'word', ''));
  v_meaning text := btrim(coalesce(p_input ->> 'meaning', ''));
  v_note text := nullif(btrim(coalesce(p_input ->> 'note', '')), '');
  v_phonetic text := nullif(btrim(coalesce(p_input ->> 'phonetic', '')), '');
  v_audio_url text := nullif(btrim(coalesce(p_input ->> 'audio_url', '')), '');
  v_examples jsonb := coalesce(p_input -> 'examples', '[]'::jsonb);
  v_first_example text;
  v_created_word public.words%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  begin
    v_deck_id := (p_input ->> 'deck_id')::uuid;
  exception when others then
    raise exception 'Choose a valid deck';
  end;

  if v_word = '' or length(v_word) > 80 then
    raise exception 'Word must be between 1 and 80 characters';
  end if;

  if v_meaning = '' or length(v_meaning) > 500 then
    raise exception 'Meaning must be between 1 and 500 characters';
  end if;

  if v_note is not null and length(v_note) > 500 then
    raise exception 'Note must be 500 characters or fewer';
  end if;

  if v_phonetic is not null and length(v_phonetic) > 120 then
    raise exception 'Pronunciation is too long';
  end if;

  if v_audio_url is not null and (length(v_audio_url) > 2048 or v_audio_url !~* '^https?://[^[:space:]]+$') then
    raise exception 'Audio URL must be a valid http(s) URL';
  end if;

  if jsonb_typeof(v_examples) <> 'array' then
    raise exception 'Use up to 3 examples';
  end if;

  if jsonb_array_length(v_examples) > 3 then
    raise exception 'Use up to 3 examples';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_examples) as item(value)
    where length(btrim(coalesce(value ->> 'sentence', ''))) > 500
       or length(btrim(coalesce(value ->> 'translation', ''))) > 500
  ) then
    raise exception 'Examples and translations must be 500 characters or fewer';
  end if;

  if not exists (select 1 from public.decks where id = v_deck_id and user_id = v_user_id) then
    raise exception 'Deck not found';
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
    v_note,
    v_phonetic,
    v_audio_url
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

create or replace function private.update_word_with_examples(p_word_id uuid, p_input jsonb)
returns public.words
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_deck_id uuid;
  v_word text := btrim(coalesce(p_input ->> 'word', ''));
  v_meaning text := btrim(coalesce(p_input ->> 'meaning', ''));
  v_note text := nullif(btrim(coalesce(p_input ->> 'note', '')), '');
  v_phonetic text := nullif(btrim(coalesce(p_input ->> 'phonetic', '')), '');
  v_audio_url text := nullif(btrim(coalesce(p_input ->> 'audio_url', '')), '');
  v_examples jsonb := coalesce(p_input -> 'examples', '[]'::jsonb);
  v_first_example text;
  v_updated_word public.words%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  begin
    v_deck_id := (p_input ->> 'deck_id')::uuid;
  exception when others then
    raise exception 'Choose a valid deck';
  end;

  if v_word = '' or length(v_word) > 80 then
    raise exception 'Word must be between 1 and 80 characters';
  end if;

  if v_meaning = '' or length(v_meaning) > 500 then
    raise exception 'Meaning must be between 1 and 500 characters';
  end if;

  if v_note is not null and length(v_note) > 500 then
    raise exception 'Note must be 500 characters or fewer';
  end if;

  if v_phonetic is not null and length(v_phonetic) > 120 then
    raise exception 'Pronunciation is too long';
  end if;

  if v_audio_url is not null and (length(v_audio_url) > 2048 or v_audio_url !~* '^https?://[^[:space:]]+$') then
    raise exception 'Audio URL must be a valid http(s) URL';
  end if;

  if jsonb_typeof(v_examples) <> 'array' then
    raise exception 'Use up to 3 examples';
  end if;

  if jsonb_array_length(v_examples) > 3 then
    raise exception 'Use up to 3 examples';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_examples) as item(value)
    where length(btrim(coalesce(value ->> 'sentence', ''))) > 500
       or length(btrim(coalesce(value ->> 'translation', ''))) > 500
  ) then
    raise exception 'Examples and translations must be 500 characters or fewer';
  end if;

  if not exists (select 1 from public.words where id = p_word_id and user_id = v_user_id) then
    raise exception 'Word not found';
  end if;

  if not exists (select 1 from public.decks where id = v_deck_id and user_id = v_user_id) then
    raise exception 'Deck not found';
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
      note = v_note,
      phonetic = v_phonetic,
      audio_url = v_audio_url,
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
