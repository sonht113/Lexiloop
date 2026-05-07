import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { WordForm } from '@/features/words/word-form';
import { useWordQuery } from '@/features/words/word-hooks';

export default function EditWordScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const word = useWordQuery(id);

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-5 pb-8" showsVerticalScrollIndicator={false}>
        <AppText className="text-3xl font-bold">Edit Word</AppText>
        {word.isLoading ? <AppText className="text-muted">Loading word...</AppText> : null}
        {word.isError ? <EmptyState title="Couldn’t load word" description="Please try again later." /> : null}
        {word.data ? <WordForm word={word.data} onSuccess={() => router.back()} /> : null}
      </ScrollView>
    </Screen>
  );
}
