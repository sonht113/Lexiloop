import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AppText, Button, EmptyState, FormInput, Screen } from '@/components/ui';
import { DeckCard } from '@/features/decks/deck-card';
import { DeckForm } from '@/features/decks/deck-form';
import { useDecksQuery } from '@/features/decks/deck-hooks';
import type { Database } from '@/types/database';

type Deck = Database['public']['Tables']['decks']['Row'];

export default function DecksScreen() {
  const decks = useDecksQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [search, setSearch] = useState('');

  const filteredDecks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return decks.data ?? [];
    return (decks.data ?? []).filter((deck) => deck.name.toLowerCase().includes(keyword) || deck.description?.toLowerCase().includes(keyword));
  }, [decks.data, search]);

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-5 pb-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-3">
          <AppText className="text-3xl font-bold">Decks</AppText>
          <Button title={showCreate || editingDeck ? 'Cancel' : 'Create'} variant="secondary" onPress={() => { setShowCreate((value) => !value); setEditingDeck(null); }} />
        </View>

        <FormInput label="Search" placeholder="Search decks" value={search} onChangeText={setSearch} />
        {showCreate ? <DeckForm onSuccess={() => setShowCreate(false)} /> : null}
        {editingDeck ? <DeckForm deck={editingDeck} onSuccess={() => setEditingDeck(null)} /> : null}

        {decks.isLoading ? <AppText className="text-muted">Loading decks...</AppText> : null}
        {decks.isError ? <EmptyState title="Couldn’t load decks" description="Please try again later." /> : null}
        {decks.data?.length === 0 ? <EmptyState title="No decks yet" description="Create your first deck or use the default Daily Life deck after signup." /> : null}
        {decks.data?.length ? filteredDecks.map((deck) => <DeckCard key={deck.id} deck={deck} onEdit={setEditingDeck} />) : null}
        {decks.data?.length && filteredDecks.length === 0 ? <EmptyState title="No matching decks" description="Try another search keyword." /> : null}
      </ScrollView>
    </Screen>
  );
}
