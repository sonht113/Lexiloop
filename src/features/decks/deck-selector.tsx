import { Pressable, View } from 'react-native';
import { AppText } from '@/components/ui';
import { useAppTheme } from '@/lib/theme-provider';
import type { Database } from '@/types/database';

type Deck = Database['public']['Tables']['decks']['Row'];

export function DeckSelector({ decks, value, onChange }: { decks: Deck[]; value: string; onChange: (deckId: string) => void }) {
  const { colors } = useAppTheme();

  return (
    <View className="gap-2">
      <AppText className="font-semibold">Deck</AppText>
      <View className="flex-row flex-wrap gap-2">
        {decks.map((deck) => {
          const selected = deck.id === value;
          return (
            <Pressable
              key={deck.id}
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: selected ? colors.primary : colors.primarySoft }}
              onPress={() => onChange(deck.id)}
            >
              <AppText className="font-semibold" style={{ color: selected ? '#ffffff' : colors.primary }}>{deck.name}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
