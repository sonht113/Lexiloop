import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { useDecksQuery } from '@/features/decks/deck-hooks';
import { WordForm } from '@/features/words/word-form';

export default function QuickAddScreen() {
  const router = useRouter();
  const decks = useDecksQuery();
  const defaultDeck = decks.data?.[0];

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-5 pb-8" showsVerticalScrollIndicator={false}>
        <AppText className="text-3xl font-bold">Quick Add</AppText>
        {decks.isLoading ? <AppText className="text-muted">Loading decks...</AppText> : null}
        {decks.data?.length === 0 ? <EmptyState title="No deck available" description="Create a deck before adding words." /> : null}
        {defaultDeck ? <WordForm defaultDeckId={defaultDeck.id} onSuccess={(mode) => mode === 'done' && router.back()} /> : null}
      </ScrollView>
    </Screen>
  );
}
