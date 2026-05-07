import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AppText, Button, EmptyState, FormInput, Screen } from '@/components/ui';
import { useDueWordsQuery } from '@/features/review/review-hooks';
import { WordCard } from '@/features/words/word-card';
import { WordForm } from '@/features/words/word-form';
import { useWordsQuery } from '@/features/words/word-hooks';

const filters = ['All', 'Due', 'New', 'Learning', 'Mastered'] as const;
type Filter = typeof filters[number];

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const words = useWordsQuery(id);
  const dueWords = useDueWordsQuery(id);
  const [showAddWord, setShowAddWord] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const filteredWords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (words.data ?? []).filter((word) => {
      const isDue = new Date(word.due_at).getTime() <= Date.now();
      const status = word.correct_streak >= 5 ? 'Mastered' : isDue ? 'Due' : word.review_count === 0 ? 'New' : 'Learning';
      const matchesFilter = filter === 'All' || status === filter;
      const matchesSearch = !keyword || word.word.toLowerCase().includes(keyword) || word.meaning.toLowerCase().includes(keyword);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, words.data]);

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-5 pb-8" showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <AppText className="text-3xl font-bold">Deck Detail</AppText>
          <AppText className="text-muted">{dueWords.data?.length ?? 0} due · {words.data?.length ?? 0} words</AppText>
        </View>

        <View className="flex-row gap-3">
          <Link href={`/(protected)/review/session?deckId=${id}`} asChild>
            <Button title={(dueWords.data?.length ?? 0) > 0 ? 'Start Review' : 'No words due'} disabled={(dueWords.data?.length ?? 0) === 0} className="flex-1" />
          </Link>
          <Button title={showAddWord ? 'Cancel' : 'Add Word'} variant="secondary" className="flex-1" onPress={() => setShowAddWord((value) => !value)} />
        </View>

        {showAddWord ? <WordForm defaultDeckId={id} onSuccess={(mode) => mode === 'done' && setShowAddWord(false)} /> : null}

        <FormInput label="Search" placeholder="Search words" value={search} onChangeText={setSearch} />
        <View className="flex-row flex-wrap gap-2">
          {filters.map((item) => <Button key={item} title={item} variant={filter === item ? 'primary' : 'secondary'} onPress={() => setFilter(item)} />)}
        </View>

        {words.isLoading ? <AppText className="text-muted">Loading words...</AppText> : null}
        {words.isError ? <EmptyState title="Couldn’t load words" description="Please try again later." /> : null}
        {words.data?.length === 0 ? <EmptyState title="No words yet" description="Add your first word to start reviewing." /> : null}
        {words.data?.length ? filteredWords.map((word) => <WordCard key={word.id} word={word} />) : null}
        {words.data?.length && filteredWords.length === 0 ? <EmptyState title="No matching words" description="Try another search or filter." /> : null}
      </ScrollView>
    </Screen>
  );
}
