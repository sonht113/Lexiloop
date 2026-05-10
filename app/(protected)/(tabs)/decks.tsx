import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Plus, Search, X } from 'lucide-react-native';
import { AppText, EmptyState } from '@/components/ui';
import { DeckCard } from '@/features/decks/deck-card';
import { DeckForm } from '@/features/decks/deck-form';
import { useDecksQuery, type DeckWithStats } from '@/features/decks/deck-hooks';
import { useAppTheme } from '@/lib/theme-provider';

export default function DecksScreen() {
  const decks = useDecksQuery();
  const { colors } = useAppTheme();
  const [editingDeck, setEditingDeck] = useState<DeckWithStats | null>(null);
  const [isDeckModalVisible, setIsDeckModalVisible] = useState(false);
  const [openMenuDeckId, setOpenMenuDeckId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredDecks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return decks.data ?? [];
    return (decks.data ?? []).filter((deck) => {
      return deck.name.toLowerCase().includes(keyword) || deck.description?.toLowerCase().includes(keyword);
    });
  }, [decks.data, search]);

  const openCreateSheet = () => {
    setOpenMenuDeckId(null);
    setEditingDeck(null);
    setIsDeckModalVisible(true);
  };

  const openEditSheet = (deck: DeckWithStats) => {
    setEditingDeck(deck);
    setIsDeckModalVisible(true);
  };

  const closeSheet = () => {
    setIsDeckModalVisible(false);
    setEditingDeck(null);
  };

  return (
    <View className="flex-1 px-5" style={{ backgroundColor: colors.canvas }}>
      <ScrollView contentContainerClassName="pb-8 pt-6" showsVerticalScrollIndicator={false}>
        <View>
          <AppText className="text-2xl font-bold leading-8" style={{ color: colors.text }}>Decks</AppText>
          <View className="mt-4 h-[49px] flex-row items-center rounded-xl border px-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Search color={colors.muted} size={18} />
            <TextInput
              className="ml-3 flex-1 text-base"
              style={{ color: colors.text }}
              placeholder="Search decks..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View className="mt-6 gap-4">
          {decks.isLoading ? <AppText style={{ color: colors.muted }}>Loading decks...</AppText> : null}
          {decks.isError ? <EmptyState title="Could not load decks" description="Please try again later." /> : null}
          {decks.data?.length === 0 ? <EmptyState title="No decks yet" description="Create your first deck or use the default Daily Life deck after signup." /> : null}
          {filteredDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              isMenuOpen={openMenuDeckId === deck.id}
              onToggleMenu={() => setOpenMenuDeckId((current) => current === deck.id ? null : deck.id)}
              onEdit={openEditSheet}
            />
          ))}
          {decks.data?.length && filteredDecks.length === 0 ? <EmptyState title="No matching decks" description="Try another search keyword." /> : null}
          <CreateDeckCard onPress={openCreateSheet} />
        </View>
      </ScrollView>

      <Modal
        visible={isDeckModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close deck modal backdrop"
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
            onPress={closeSheet}
          />
          <View
            className="rounded-t-[28px]"
            style={{ maxHeight: '78%', backgroundColor: colors.surface }}
          >
            <View className="items-center pb-4 pt-4">
              <View className="h-1.5 w-12 rounded-full" style={{ backgroundColor: colors.border }} />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-6 flex-row items-center justify-between">
                <AppText className="text-2xl font-bold leading-8" style={{ color: colors.text }}>{editingDeck ? 'Edit Deck' : 'Create New Deck'}</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close deck modal"
                  className="h-10 w-10 items-center justify-center rounded-full"
                  hitSlop={8}
                  onPress={closeSheet}
                >
                  <X color={colors.muted} size={28} strokeWidth={2.4} />
                </Pressable>
              </View>
              <DeckForm deck={editingDeck ?? undefined} onSuccess={closeSheet} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function CreateDeckCard({ onPress }: { onPress: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create new deck"
      className="min-h-[180px] items-center justify-center rounded-xl border px-4 py-12"
      style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary }}
      onPress={onPress}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: colors.surface }}>
        <Plus color={colors.primary} size={18} strokeWidth={2.4} />
      </View>
      <AppText className="mt-2 text-base font-medium leading-6" style={{ color: colors.primary }}>
        Create New Deck
      </AppText>
    </Pressable>
  );
}
