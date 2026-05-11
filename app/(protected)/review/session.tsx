import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, Flame, RotateCcw, Volume2, X } from 'lucide-react-native';
import { AppText, Button, Card, EmptyState, Screen, useAppAlert } from '@/components/ui';
import { useHomeStatsQuery } from '@/features/home/home-hooks';
import {
  useAnswerWordReviewMutation,
  useDueWordsQuery,
  useNewWordsQuery,
  usePracticeWordsQuery,
  useWeakWordsQuery,
  type ReviewWord,
} from '@/features/review/review-hooks';
import { useAppTheme } from '@/lib/theme-provider';
import type { ReviewResult } from '@/types/database';

const NEW_WORDS_SESSION_LIMIT = 5;

type ReviewMode = 'due' | 'practice' | 'weak' | 'new';

type ReviewExample = {
  id: string;
  sentence: string;
  translation: string | null;
  sort_order: number;
};

type SessionSummary = {
  forgot: number;
  soon: number;
  remembered: number;
  mastered: number;
  practiced: number;
  repeatedCards: number;
};

type PracticeProgress = Record<string, { remembered: number; forgot: number; seen: boolean }>;

function getExamples(word: ReviewWord): ReviewExample[] {
  const examples = (word.word_examples ?? [])
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((example) => ({
      id: example.id,
      sentence: example.sentence,
      translation: example.translation,
      sort_order: example.sort_order,
    }));

  if (examples.length > 0) return examples.slice(0, 3);
  if (word.example) return [{ id: `${word.id}-legacy-example`, sentence: word.example, translation: null, sort_order: 0 }];
  return [];
}

async function playPronunciation(audioUrl?: string | null) {
  if (!audioUrl) return;
  try {
    const player = createAudioPlayer(audioUrl);
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return;
      subscription.remove();
      player.remove();
    });
    player.play();
  } catch {
    throw new Error('Could not play pronunciation for this word.');
  }
}

function SpeakerButton({ audioUrl, compact = false }: { audioUrl?: string | null; compact?: boolean }) {
  const { colors } = useAppTheme();
  const appAlert = useAppAlert();

  if (!audioUrl) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Play pronunciation"
      className={`${compact ? 'h-9 w-9' : 'h-12 w-12'} items-center justify-center rounded-full`}
      style={{ backgroundColor: colors.primarySoft }}
      onPress={() => {
        void playPronunciation(audioUrl).catch((error) => {
          appAlert.show({ title: 'Audio unavailable', message: error instanceof Error ? error.message : 'Please try again.', variant: 'warning' });
        });
      }}
    >
      <Volume2 color={colors.primary} size={compact ? 18 : 22} />
    </Pressable>
  );
}

function FlashcardFront({ word, modeLabel, onReveal }: { word: ReviewWord; modeLabel: string; onReveal: () => void }) {
  const { colors } = useAppTheme();

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Reveal word meaning" onPress={onReveal}>
      <Card className="min-h-[542px] justify-between overflow-hidden border px-7 py-8" style={{ borderColor: colors.border }}>
        <View className="items-center gap-3">
          <AppText className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: colors.primarySoft, color: colors.primary }}>
            {word.decks?.name ?? modeLabel}
          </AppText>
          <AppText className="text-center text-sm font-medium" style={{ color: colors.muted }}>Review card</AppText>
        </View>

        <View className="items-center gap-5">
          <View className="h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: colors.primarySoft }}>
            <AppText className="text-5xl font-bold" style={{ color: colors.primary }}>{word.word.slice(0, 1).toUpperCase()}</AppText>
          </View>
          <View className="items-center gap-3">
            <AppText className="text-center text-5xl font-bold leading-[58px]" style={{ color: colors.text }}>{word.word}</AppText>
            {word.phonetic ? <AppText className="text-center text-lg" style={{ color: colors.muted }}>{word.phonetic}</AppText> : null}
          </View>
          <SpeakerButton audioUrl={word.audio_url} />
        </View>

        <View className="items-center gap-2">
          <AppText className="text-center text-base font-semibold" style={{ color: colors.text }}>Tap to reveal</AppText>
          <AppText className="text-center text-sm" style={{ color: colors.muted }}>Check the meaning when you are ready.</AppText>
        </View>
      </Card>
    </Pressable>
  );
}

function FlashcardBack({
  word,
  examplesExpanded,
  onToggleExamples,
  onReturnFront,
}: {
  word: ReviewWord;
  examplesExpanded: boolean;
  onToggleExamples: () => void;
  onReturnFront: () => void;
}) {
  const { colors } = useAppTheme();
  const examples = getExamples(word);
  const visibleExamples = examplesExpanded ? examples : examples.slice(0, 2);
  const canExpand = examples.length > 2;

  return (
    <Card className="max-h-[542px] overflow-hidden border p-0" style={{ borderColor: colors.border }}>
      <View className="flex-row items-center justify-between border-b px-6 py-4" style={{ backgroundColor: colors.primarySoft, borderColor: colors.border }}>
        <View className="flex-1 pr-3">
          <AppText className="text-2xl font-bold" style={{ color: colors.text }}>{word.word}</AppText>
          {word.phonetic ? <AppText className="mt-1" style={{ color: colors.muted }}>{word.phonetic}</AppText> : null}
        </View>
        <View className="flex-row items-center gap-2">
          <SpeakerButton audioUrl={word.audio_url} compact />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to word side"
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.surface }}
            onPress={onReturnFront}
          >
            <RotateCcw color={colors.primary} size={18} />
          </Pressable>
        </View>
      </View>

      <ScrollView className="max-h-[410px]" contentContainerClassName="gap-5 px-6 py-6" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <AppText className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.primary }}>Meaning</AppText>
          <AppText className="text-xl font-semibold leading-7" style={{ color: colors.text }}>{word.meaning}</AppText>
        </View>

        {examples.length > 0 ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <AppText className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.primary }}>Examples</AppText>
              {canExpand ? (
                <Pressable accessibilityRole="button" className="flex-row items-center gap-1" onPress={onToggleExamples}>
                  <AppText className="text-sm font-semibold" style={{ color: colors.primary }}>{examplesExpanded ? 'Show less' : 'Show all'}</AppText>
                  {examplesExpanded ? <ChevronUp color={colors.primary} size={16} /> : <ChevronDown color={colors.primary} size={16} />}
                </Pressable>
              ) : null}
            </View>
            {visibleExamples.map((example, index) => (
              <View key={example.id} className="gap-2 rounded-2xl p-4" style={{ backgroundColor: colors.canvas }}>
                <AppText className="text-xs font-semibold" style={{ color: colors.muted }}>Example {index + 1}</AppText>
                <AppText className="text-base leading-6" style={{ color: colors.text }}>{`"${example.sentence}"`}</AppText>
                {example.translation ? <AppText className="text-sm leading-5" style={{ color: colors.muted }}>{example.translation}</AppText> : null}
              </View>
            ))}
          </View>
        ) : null}

        {word.note ? (
          <View className="gap-2 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <AppText className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.primary }}>Context</AppText>
            <AppText className="text-sm leading-6" style={{ color: colors.muted }}>{word.note}</AppText>
          </View>
        ) : null}
      </ScrollView>
    </Card>
  );
}

function SummaryRow({ icon, label, value, valueColor }: { icon: ReactNode; label: string; value: number; valueColor?: string }) {
  const { colors } = useAppTheme();

  return (
    <View className="min-h-[40px] flex-row items-center justify-between border-b py-2 last:border-b-0" style={{ borderColor: colors.border }}>
      <View className="flex-row items-center gap-3">
        {icon}
        <AppText className="text-base font-medium leading-6" style={{ color: colors.muted }}>{label}</AppText>
      </View>
      <AppText className="text-base font-medium leading-6" style={{ color: valueColor ?? colors.text }}>{value}</AppText>
    </View>
  );
}

function ReviewDoneScreen({
  summary,
  mode,
  currentStreak,
  onBackHome,
  onAddNewWord,
}: {
  summary: SessionSummary;
  mode: ReviewMode;
  currentStreak?: number;
  onBackHome: () => void;
  onAddNewWord: () => void;
}) {
  const { colors } = useAppTheme();
  const isLocalPracticeMode = mode === 'practice';
  const isNewMode = mode === 'new';
  const isWeakMode = mode === 'weak';
  const reviewed = isLocalPracticeMode ? summary.practiced : summary.forgot + summary.soon + summary.remembered;
  const streakLabel = typeof currentStreak === 'number' ? `${currentStreak} day streak` : '-- day streak';
  const title = isLocalPracticeMode ? 'Practice complete' : isWeakMode ? 'Weak review complete' : isNewMode ? 'New words learned' : 'All done for today';
  const subtitle = isLocalPracticeMode
    ? 'Your SRS schedule stayed unchanged.'
    : isWeakMode
      ? 'Weak words were rescheduled by how well you remembered them.'
      : isNewMode
        ? 'These words are now in your review schedule.'
        : 'Great job. Come back tomorrow.';

  return (
    <Screen className="px-5" style={{ backgroundColor: colors.canvas }}>
      <ScrollView contentContainerClassName="min-h-full justify-between pb-6 pt-4" showsVerticalScrollIndicator={false}>
        <View>
          <View className="items-center pt-2">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: colors.primarySoft }}>
              <CheckCircle2 color={colors.success} size={40} strokeWidth={2.5} />
            </View>
            <AppText className="text-center text-[32px] font-bold leading-10" style={{ color: colors.text }}>{title}</AppText>
            <AppText className="mt-4 text-center text-base leading-6" style={{ color: colors.muted }}>{subtitle}</AppText>
          </View>

          <View className="mt-8 gap-4">
            <Card className="rounded-xl border p-6 shadow-none" style={{ borderColor: colors.border }}>
              <AppText className="mb-2 text-lg font-semibold leading-6" style={{ color: colors.text }}>Session Summary</AppText>
              <SummaryRow icon={<ClipboardCheck color={colors.muted} size={18} strokeWidth={2.4} />} label={isLocalPracticeMode ? 'Practiced' : 'Reviewed'} value={reviewed} />
              <SummaryRow icon={<CheckCircle2 color={colors.success} size={18} strokeWidth={2.4} />} label="Remembered" value={summary.remembered} valueColor={colors.success} />
              {!isLocalPracticeMode ? (
                <SummaryRow icon={<RotateCcw color={colors.primary} size={18} strokeWidth={2.4} />} label="Review soon" value={summary.soon} valueColor={colors.primary} />
              ) : null}
              {isLocalPracticeMode ? (
                <SummaryRow icon={<RotateCcw color={colors.primary} size={18} strokeWidth={2.4} />} label="Repeated cards" value={summary.repeatedCards} valueColor={colors.primary} />
              ) : (
                <SummaryRow icon={<CheckCircle2 color={colors.success} size={18} strokeWidth={2.4} />} label="Mastered today" value={summary.mastered} valueColor={colors.success} />
              )}
              <SummaryRow icon={<Flame color={colors.warning} fill={colors.warning} size={19} strokeWidth={2.2} />} label="Need practice" value={summary.forgot} valueColor={colors.warning} />
            </Card>

            <View className="min-h-[98px] flex-row items-center rounded-xl border px-6 py-6" style={{ backgroundColor: colors.primarySoft, borderColor: colors.border }}>
              <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: colors.surface }}>
                <Flame color={colors.warning} fill={colors.warning} size={21} strokeWidth={2.2} />
              </View>
              <View className="ml-4">
                <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>{isLocalPracticeMode ? 'Practice does not move due dates' : streakLabel}</AppText>
                <AppText className="text-[13px] leading-[18px]" style={{ color: colors.muted }}>
                  {isLocalPracticeMode ? 'Use Review Due for spaced repetition progress.' : "You're on a roll!"}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-4 pt-6">
          <Pressable accessibilityRole="button" className="min-h-14 items-center justify-center rounded-lg" style={{ backgroundColor: colors.primary }} onPress={onBackHome}>
            <AppText className="text-base font-medium leading-6" style={{ color: '#ffffff' }}>Back Home</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="min-h-14 items-center justify-center rounded-lg border"
            style={{ backgroundColor: colors.primarySoft, borderColor: colors.border }}
            onPress={onAddNewWord}
          >
            <AppText className="text-base font-medium leading-6" style={{ color: colors.primary }}>
              Add New Word
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ReviewEmptyScreen({ mode, onBackHome, onAddNewWord }: { mode: ReviewMode; onBackHome: () => void; onAddNewWord: () => void }) {
  const { colors } = useAppTheme();
  const copy = {
    due: {
      title: 'No reviews due',
      description: 'Your scheduled reviews are clear right now.',
    },
    new: {
      title: 'No new words',
      description: 'Add more words to start a new learning session.',
    },
    weak: {
      title: 'No weak words',
      description: 'Words you miss will appear here for extra practice.',
    },
    practice: {
      title: 'No words to practice',
      description: 'Add words to this deck before starting practice.',
    },
  }[mode];

  return (
    <Screen className="items-center justify-center px-5" style={{ backgroundColor: colors.canvas }}>
      <EmptyState title={copy.title} description={copy.description}>
        <View className="w-full min-w-52 gap-3">
          <Button title="Back Home" onPress={onBackHome} />
          <Button title="Add New Word" variant="secondary" onPress={onAddNewWord} />
        </View>
      </EmptyState>
    </Screen>
  );
}

export default function ReviewSessionScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const appAlert = useAppAlert();
  const { deckId, mode } = useLocalSearchParams<{ deckId?: string; mode?: string }>();
  const reviewMode: ReviewMode = mode === 'practice' || mode === 'weak' || mode === 'new' ? mode : 'due';
  const isLocalPracticeMode = reviewMode === 'practice';
  const dueWords = useDueWordsQuery(deckId, reviewMode === 'due');
  const practiceWords = usePracticeWordsQuery(deckId, reviewMode === 'practice');
  const weakWords = useWeakWordsQuery(deckId, reviewMode === 'weak');
  const newWords = useNewWordsQuery(deckId, NEW_WORDS_SESSION_LIMIT, reviewMode === 'new');
  const activeWords = reviewMode === 'practice' ? practiceWords : reviewMode === 'weak' ? weakWords : reviewMode === 'new' ? newWords : dueWords;
  const answer = useAnswerWordReviewMutation();
  const stats = useHomeStatsQuery();
  const [sessionWords, setSessionWords] = useState<ReviewWord[]>([]);
  const [initialSessionWordCount, setInitialSessionWordCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [examplesExpanded, setExamplesExpanded] = useState(false);
  const [summary, setSummary] = useState<SessionSummary>({ forgot: 0, soon: 0, remembered: 0, mastered: 0, practiced: 0, repeatedCards: 0 });
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress>({});

  useEffect(() => {
    if (hasStarted || !activeWords.data) return;
    setSessionWords(activeWords.data);
    setInitialSessionWordCount(activeWords.data.length);
    setHasStarted(true);
  }, [activeWords.data, hasStarted]);

  const current = sessionWords[0];
  const totalAnswered = summary.forgot + summary.soon + summary.remembered;
  const completedPracticeCount = isLocalPracticeMode ? summary.remembered : 0;
  const total = initialSessionWordCount;
  const completedCount = isLocalPracticeMode ? completedPracticeCount : totalAnswered;
  const progress = total ? `${Math.min(completedCount + (current ? 1 : 0), total)} / ${total}` : '0 / 0';
  const progressPercent = total ? (Math.min(completedCount + (current ? 1 : 0), total) / total) * 100 : 0;
  const modeLabel = reviewMode === 'practice' ? 'Practice all' : reviewMode === 'weak' ? 'Weak review' : reviewMode === 'new' ? 'Learn new' : deckId ? 'Deck review' : 'Daily review';
  const isSubmitting = !isLocalPracticeMode && answer.isPending;

  const close = () => {
    if (completedCount > 0 && sessionWords.length > 0) {
      appAlert.show({
        title: 'End review session?',
        message: isLocalPracticeMode ? 'This practice session will end.' : 'Your progress in this session will be saved.',
        variant: 'danger',
        actions: [
          { text: 'Keep reviewing', style: 'cancel' },
          { text: 'End session', style: 'destructive', onPress: () => router.back() },
        ],
      });
      return;
    }
    router.back();
  };

  const submit = async (result: ReviewResult) => {
    if (!current || isSubmitting) return;

    if (isLocalPracticeMode) {
      const previous = practiceProgress[current.id] ?? { remembered: 0, forgot: 0, seen: false };
      const nextRemembered = result === 'remembered' ? previous.remembered + 1 : previous.remembered;
      const nextForgot = result === 'forgot' || result === 'soon' ? previous.forgot + 1 : previous.forgot;
      const completed = result === 'remembered';

      setPracticeProgress((value) => ({
        ...value,
        [current.id]: {
          remembered: nextRemembered,
          forgot: nextForgot,
          seen: true,
        },
      }));
      setSummary((value) => ({
        ...value,
        practiced: value.practiced + (previous.seen ? 0 : 1),
        remembered: value.remembered + (completed && previous.remembered === 0 ? 1 : 0),
        forgot: value.forgot + ((result === 'forgot' || result === 'soon') && previous.forgot === 0 ? 1 : 0),
        repeatedCards: value.repeatedCards + (previous.seen ? 1 : 0),
      }));
      setRevealed(false);
      setExamplesExpanded(false);
      setSessionWords((value) => {
        const [, ...rest] = value;
        return completed ? rest : [...rest, current];
      });
      return;
    }

    try {
      const reviewResult = await answer.mutateAsync({ wordId: current.id, result });
      setSummary((value) => ({
        ...value,
        [result]: value[result] + 1,
        mastered: value.mastered + (reviewResult.newly_mastered ? 1 : 0),
      }));
      setRevealed(false);
      setExamplesExpanded(false);
      setSessionWords((value) => value.slice(1));
    } catch (error) {
      appAlert.show({ title: 'Review failed', message: error instanceof Error ? error.message : 'Please try again.', variant: 'danger' });
    }
  };

  if (activeWords.isError) {
    return (
      <Screen className="items-center justify-center px-5" style={{ backgroundColor: colors.canvas }}>
        <EmptyState title="Could not load review" description="Please try again later." />
        <Button title="Back" className="mt-4 min-w-32" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (activeWords.isLoading || !hasStarted) {
    return <Screen className="items-center justify-center"><AppText style={{ color: colors.muted }}>Loading review...</AppText></Screen>;
  }

  if (!current && initialSessionWordCount === 0) {
    return (
      <ReviewEmptyScreen
        mode={reviewMode}
        onBackHome={() => router.replace('/(protected)/(tabs)/home')}
        onAddNewWord={() => router.push('/(protected)/word/quick-add')}
      />
    );
  }

  if (!current) {
    return (
      <ReviewDoneScreen
        summary={summary}
        mode={reviewMode}
        currentStreak={isLocalPracticeMode ? undefined : stats.data?.currentStreak}
        onBackHome={() => router.replace('/(protected)/(tabs)/home')}
        onAddNewWord={() => router.push('/(protected)/word/quick-add')}
      />
    );
  }

  return (
    <Screen className="px-0" style={{ backgroundColor: colors.canvas }}>
      <View className="border-b px-5 pb-4 pt-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <View className="h-12 flex-row items-center justify-between">
          <Pressable accessibilityRole="button" accessibilityLabel="Close review" className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.primarySoft }} onPress={close}>
            <X color={colors.text} size={20} />
          </Pressable>
          <AppText className="text-lg font-bold" style={{ color: colors.text }}>Review</AppText>
          <AppText className="w-10 text-right text-sm font-semibold" style={{ color: colors.muted }}>{progress}</AppText>
        </View>
        <View className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.primarySoft }}>
          <View className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: colors.primary }} />
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <AppText className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.muted }}>{modeLabel}</AppText>
          <AppText className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: colors.primarySoft, color: colors.primary }}>{current.decks?.name ?? 'Review'}</AppText>
        </View>
      </View>

      <View className="flex-1 justify-center px-5 py-5">
        {revealed ? (
          <FlashcardBack
            word={current}
            examplesExpanded={examplesExpanded}
            onToggleExamples={() => setExamplesExpanded((value) => !value)}
            onReturnFront={() => {
              setRevealed(false);
              setExamplesExpanded(false);
            }}
          />
        ) : (
          <FlashcardFront word={current} modeLabel={modeLabel} onReveal={() => setRevealed(true)} />
        )}
      </View>

      <View className="border-t px-5 pb-6 pt-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        {isLocalPracticeMode ? (
          <View className="flex-row gap-3">
            <Button title="Forgot" variant="danger" disabled={!revealed || isSubmitting} className="flex-1 rounded-xl" onPress={() => submit('forgot')} />
            <Button title="Remembered" disabled={!revealed || isSubmitting} className="flex-1 rounded-xl" style={{ backgroundColor: colors.success }} onPress={() => submit('remembered')} />
          </View>
        ) : (
          <View className="flex-row gap-2">
            <Button title="Forgot" variant="danger" disabled={!revealed || isSubmitting} className="flex-1 rounded-xl px-2" onPress={() => submit('forgot')} />
            <Button title="Soon" variant="secondary" disabled={!revealed || isSubmitting} className="flex-1 rounded-xl px-2" onPress={() => submit('soon')} />
            <Button title="Remembered" disabled={!revealed || isSubmitting} className="flex-1 rounded-xl px-2" style={{ backgroundColor: colors.success }} onPress={() => submit('remembered')} />
          </View>
        )}
      </View>
    </Screen>
  );
}
