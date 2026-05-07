import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';
import { Button, FormInput } from '@/components/ui';
import { useCreateDeckMutation, useUpdateDeckMutation } from './deck-hooks';
import { deckFormSchema, type DeckFormValues } from './deck-schema';
import type { Database } from '@/types/database';

type Deck = Database['public']['Tables']['decks']['Row'];

export function DeckForm({ deck, onSuccess }: { deck?: Deck; onSuccess?: () => void }) {
  const createDeck = useCreateDeckMutation();
  const updateDeck = useUpdateDeckMutation();
  const isEditing = Boolean(deck);
  const isSaving = createDeck.isPending || updateDeck.isPending;
  const form = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      name: deck?.name ?? '',
      description: deck?.description ?? '',
      icon: deck?.icon ?? 'book-open',
      color: deck?.color ?? '#6366F1',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const input = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        icon: values.icon || 'book-open',
        color: values.color || '#6366F1',
      };
      if (deck) await updateDeck.mutateAsync({ deckId: deck.id, input });
      else await createDeck.mutateAsync(input);
      if (!deck) form.reset();
      onSuccess?.();
    } catch (error) {
      Alert.alert(isEditing ? 'Update deck failed' : 'Create deck failed', error instanceof Error ? error.message : 'Please try again.');
    }
  });

  return (
    <View className="gap-4">
      <Controller control={form.control} name="name" render={({ field, fieldState }) => (
        <FormInput label="Deck name" placeholder="Daily Life" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Controller control={form.control} name="description" render={({ field, fieldState }) => (
        <FormInput label="Description" placeholder="Everyday vocabulary" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Button title={isSaving ? 'Saving...' : isEditing ? 'Save Deck' : 'Create Deck'} disabled={isSaving} onPress={onSubmit} />
    </View>
  );
}
