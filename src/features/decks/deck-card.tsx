import { Link } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import type { Database } from '@/types/database';
import { useDeleteDeckMutation } from './deck-hooks';

type Deck = Database['public']['Tables']['decks']['Row'];

export function DeckCard({ deck, dueCount = 0, totalCount = 0, onEdit }: { deck: Deck; dueCount?: number; totalCount?: number; onEdit?: (deck: Deck) => void }) {
  const deleteDeck = useDeleteDeckMutation();

  const confirmDelete = () => {
    Alert.alert('Delete this deck?', 'All words inside will also be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDeck.mutate(deck.id) },
    ]);
  };

  return (
    <Card className="gap-3">
      <Link href={`/(protected)/deck/${deck.id}`} asChild>
        <Pressable className="gap-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <AppText className="text-xl font-semibold">{deck.name}</AppText>
              {deck.description ? <AppText className="mt-1 text-muted">{deck.description}</AppText> : null}
            </View>
            <View className="h-10 w-10 rounded-2xl" style={{ backgroundColor: deck.color ?? '#6366F1' }} />
          </View>
          <AppText className="text-sm text-muted">{dueCount} due · {totalCount} words</AppText>
        </Pressable>
      </Link>
      <View className="flex-row gap-4 pt-1">
        {onEdit ? <Pressable onPress={() => onEdit(deck)}><AppText className="font-semibold text-primary-700">Edit</AppText></Pressable> : null}
        <Pressable onPress={confirmDelete}><AppText className="font-semibold text-danger">Delete</AppText></Pressable>
      </View>
    </Card>
  );
}
