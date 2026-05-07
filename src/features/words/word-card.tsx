import { Link } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import type { Database } from '@/types/database';
import { useDeleteWordMutation } from './word-hooks';

type Word = Database['public']['Tables']['words']['Row'];

export function WordCard({ word }: { word: Word }) {
  const deleteWord = useDeleteWordMutation();
  const isDue = new Date(word.due_at).getTime() <= Date.now();
  const status = word.correct_streak >= 5 ? 'Mastered' : isDue ? 'Due' : word.review_count === 0 ? 'New' : 'Learning';

  const confirmDelete = () => {
    Alert.alert('Delete this word?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWord.mutate(word.id) },
    ]);
  };

  return (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <AppText className="text-lg font-semibold">{word.word}</AppText>
          {word.phonetic ? <AppText className="text-muted">{word.phonetic}</AppText> : null}
        </View>
        <AppText className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">{status}</AppText>
      </View>
      <AppText className="text-muted">{word.meaning}</AppText>
      {word.example ? <AppText className="text-sm text-muted">“{word.example}”</AppText> : null}
      <View className="flex-row gap-4 pt-1">
        <Link href={`/(protected)/word/${word.id}/edit`} asChild><Pressable><AppText className="font-semibold text-primary-700">Edit</AppText></Pressable></Link>
        <Pressable onPress={confirmDelete}><AppText className="font-semibold text-danger">Delete</AppText></Pressable>
      </View>
    </Card>
  );
}
