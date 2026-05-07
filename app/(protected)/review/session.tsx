import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useAnswerWordReviewMutation, useDueWordsQuery } from '@/features/review/review-hooks';
import type { Database } from '@/types/database';

type Word = Database['public']['Tables']['words']['Row'];

export default function ReviewSessionScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const dueWords = useDueWordsQuery(deckId);
  const answer = useAnswerWordReviewMutation();
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState({ forgot: 0, remembered: 0 });

  useEffect(() => {
    if (hasStarted || !dueWords.data) return;
    setSessionWords(dueWords.data as Word[]);
    setHasStarted(true);
  }, [dueWords.data, hasStarted]);

  const current = sessionWords[0];
  const totalAnswered = summary.forgot + summary.remembered;
  const total = totalAnswered + sessionWords.length;
  const progress = useMemo(() => total ? `${Math.min(totalAnswered + 1, total)} / ${total}` : '0 / 0', [total, totalAnswered]);

  const close = () => {
    if (totalAnswered > 0 && sessionWords.length > 0) {
      Alert.alert('End review session?', 'Your progress in this session will be saved.', [
        { text: 'Keep reviewing', style: 'cancel' },
        { text: 'End session', style: 'destructive', onPress: () => router.back() },
      ]);
      return;
    }
    router.back();
  };

  const submit = async (result: 'forgot' | 'remembered') => {
    if (!current || answer.isPending) return;
    try {
      await answer.mutateAsync({ wordId: current.id, result });
      setSummary((value) => ({ ...value, [result]: value[result] + 1 }));
      setRevealed(false);
      setSessionWords((value) => value.slice(1));
    } catch (error) {
      Alert.alert('Review failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  if (dueWords.isLoading || !hasStarted) {
    return <Screen className="items-center justify-center bg-slate-950"><AppText className="text-white">Loading review...</AppText></Screen>;
  }

  if (!current) {
    return (
      <Screen className="justify-center bg-slate-950">
        <Card className="gap-4 bg-slate-900">
          <AppText className="text-center text-3xl font-bold text-white">All done for today</AppText>
          <AppText className="text-center text-slate-300">Great job. Come back tomorrow.</AppText>
          <View className="flex-row justify-center gap-3">
            <AppText className="text-primary-100">Need practice: {summary.forgot}</AppText>
            <AppText className="text-primary-100">Remembered: {summary.remembered}</AppText>
          </View>
          <Button title="Back to Review" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-950 pt-6">
      <View className="flex-row items-center justify-between">
        <Button title="Close" variant="ghost" onPress={close} />
        <AppText className="font-semibold text-white">{progress}</AppText>
      </View>
      <View className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <View className="h-full bg-primary-500" style={{ width: `${total ? ((totalAnswered + 1) / total) * 100 : 0}%` }} />
      </View>
      <View className="flex-1 justify-center">
        <Pressable accessibilityRole="button" accessibilityLabel="Reveal word meaning" onPress={() => setRevealed(true)}>
          <Card className="min-h-[360px] justify-center gap-4 bg-slate-900">
            <AppText className="text-center text-primary-100">{deckId ? 'DECK REVIEW' : 'DAILY REVIEW'}</AppText>
            <AppText className="text-center text-5xl font-bold text-white">{current.word}</AppText>
            {current.phonetic ? <AppText className="text-center text-slate-300">{current.phonetic}</AppText> : null}
            {revealed ? (
              <>
                <AppText className="text-center text-xl text-white">{current.meaning}</AppText>
                {current.example ? <AppText className="text-center text-slate-300">“{current.example}”</AppText> : null}
              </>
            ) : <AppText className="text-center text-slate-300">Tap to reveal meaning</AppText>}
          </Card>
        </Pressable>
      </View>
      <View className="mb-6 flex-row gap-3">
        <Button title="Need practice" variant="secondary" disabled={!revealed || answer.isPending} className="flex-1" onPress={() => submit('forgot')} />
        <Button title="Remembered" disabled={!revealed || answer.isPending} className="flex-1" onPress={() => submit('remembered')} />
      </View>
    </Screen>
  );
}
