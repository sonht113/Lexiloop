import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';
import { Button, EmptyState, FieldError, FormInput } from '@/components/ui';
import { DeckSelector } from '@/features/decks/deck-selector';
import { useDecksQuery } from '@/features/decks/deck-hooks';
import { useCreateWordMutation, useUpdateWordMutation } from './word-hooks';
import { wordFormSchema, type WordFormValues } from './word-schema';
import { fetchDictionaryPronunciation } from './dictionary-api';
import type { Database } from '@/types/database';

type Word = Database['public']['Tables']['words']['Row'];
type PronunciationState = 'idle' | 'loading' | 'success' | 'error';

export function WordForm({ word, defaultDeckId, onSuccess }: { word?: Word; defaultDeckId?: string; onSuccess?: (mode: 'done' | 'again') => void }) {
  const createWord = useCreateWordMutation();
  const updateWord = useUpdateWordMutation();
  const decks = useDecksQuery();
  const isEditing = Boolean(word);
  const isSaving = createWord.isPending || updateWord.isPending;
  const [pronunciationState, setPronunciationState] = useState<PronunciationState>('idle');
  const lookupRequestId = useRef(0);
  const form = useForm<WordFormValues>({
    resolver: zodResolver(wordFormSchema),
    defaultValues: {
      deck_id: word?.deck_id ?? defaultDeckId ?? '',
      word: word?.word ?? '',
      meaning: word?.meaning ?? '',
      example: word?.example ?? '',
      note: word?.note ?? '',
      phonetic: word?.phonetic ?? '',
      audio_url: word?.audio_url ?? '',
    },
  });

  const selectedDeckId = form.watch('deck_id');
  const wordValue = form.watch('word');

  useEffect(() => {
    if (selectedDeckId || !decks.data?.length) return;
    const fallbackDeck = defaultDeckId && decks.data.some((deck) => deck.id === defaultDeckId) ? defaultDeckId : decks.data[0].id;
    form.setValue('deck_id', fallbackDeck, { shouldValidate: true });
  }, [decks.data, defaultDeckId, form, selectedDeckId]);

  useEffect(() => {
    if (isEditing) return;
    const query = wordValue.trim();
    if (query.length < 2) {
      setPronunciationState('idle');
      return;
    }

    const requestId = ++lookupRequestId.current;
    const timeout = setTimeout(async () => {
      try {
        setPronunciationState('loading');
        const result = await fetchDictionaryPronunciation(query);
        if (lookupRequestId.current !== requestId) return;
        form.setValue('phonetic', result.phonetic ?? '');
        form.setValue('audio_url', result.audioUrl ?? '');
        setPronunciationState(result.phonetic || result.audioUrl ? 'success' : 'error');
      } catch {
        if (lookupRequestId.current === requestId) setPronunciationState('error');
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [form, isEditing, wordValue]);

  const submit = (mode: 'done' | 'again') => form.handleSubmit(async (values) => {
    try {
      const input = {
        deck_id: values.deck_id,
        word: values.word.trim(),
        meaning: values.meaning.trim(),
        example: values.example?.trim() || null,
        note: values.note?.trim() || null,
        phonetic: values.phonetic?.trim() || null,
        audio_url: values.audio_url?.trim() || null,
      };

      if (word) await updateWord.mutateAsync({ wordId: word.id, input });
      else await createWord.mutateAsync(input);

      if (mode === 'again' && !word) {
        form.reset({ deck_id: values.deck_id, word: '', meaning: '', example: '', note: '', phonetic: '', audio_url: '' });
      }
      onSuccess?.(mode);
    } catch (error) {
      Alert.alert(isEditing ? 'Update word failed' : 'Save word failed', error instanceof Error ? error.message : 'Please try again.');
    }
  });

  return (
    <View className="gap-4">
      <Controller control={form.control} name="deck_id" render={({ field, fieldState }) => (
        <View className="gap-2">
          {decks.isLoading ? <FormInput label="Deck" editable={false} value="Loading decks..." /> : null}
          {!decks.isLoading && decks.data?.length ? <DeckSelector decks={decks.data} value={field.value} onChange={field.onChange} /> : null}
          {!decks.isLoading && decks.data?.length === 0 ? <EmptyState title="No deck available" description="Create a deck before adding words." /> : null}
          <FieldError message={fieldState.error?.message} />
        </View>
      )} />
      <Controller control={form.control} name="word" render={({ field, fieldState }) => (
        <FormInput label="Word" placeholder="Luminous" autoCapitalize="none" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Controller control={form.control} name="meaning" render={({ field, fieldState }) => (
        <FormInput label="Meaning" placeholder="Bright or shining" multiline value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Controller control={form.control} name="example" render={({ field, fieldState }) => (
        <FormInput label="Example" placeholder="The room was luminous with morning light." multiline value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Controller control={form.control} name="note" render={({ field, fieldState }) => (
        <FormInput label="Note" placeholder="Optional note" multiline value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <FormInput label="Pronunciation" editable={false} value={pronunciationState === 'loading' ? 'Fetching pronunciation...' : form.watch('phonetic') || 'No pronunciation yet'} />
      <Button title={isSaving ? 'Saving...' : isEditing ? 'Save Word' : 'Save'} disabled={isSaving || decks.data?.length === 0} onPress={submit('done')} />
      {!isEditing ? <Button title="Save & add another" variant="secondary" disabled={isSaving || decks.data?.length === 0} onPress={submit('again')} /> : null}
    </View>
  );
}
