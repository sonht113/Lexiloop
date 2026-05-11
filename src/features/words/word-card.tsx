import { useRouter } from 'expo-router';
import { CalendarClock, MoreVertical, Target } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, useAppAlert } from '@/components/ui';
import { useAppTheme } from '@/lib/theme-provider';
import { useDeleteWordMutation } from './word-hooks';
import type { WordWithExamples } from './word-hooks';

export type WordStatus = 'Due' | 'New' | 'Learning' | 'Practicing' | 'Almost mastered' | 'Mastered';

export function getWordStatus(word: WordWithExamples): WordStatus {
  const isDue = new Date(word.due_at).getTime() <= Date.now();
  if (word.correct_streak >= 5) return 'Mastered';
  if (word.review_count === 0) return 'New';
  if (isDue) return 'Due';
  if (word.correct_streak >= 4) return 'Almost mastered';
  if (word.correct_streak >= 2) return 'Practicing';
  return 'Learning';
}

export function isLearningWordStatus(status: WordStatus) {
  return status === 'New' || status === 'Due' || status === 'Learning' || status === 'Practicing' || status === 'Almost mastered';
}

function getMasteryProgressText(word: WordWithExamples, status: WordStatus) {
  if (status === 'Mastered') return 'Mastered';
  const progress = Math.max(0, Math.min(word.correct_streak, 4));
  return `${progress}/5 mastery`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getNextReviewText(dueAt: string) {
  const dueDate = new Date(dueAt);
  if (Number.isNaN(dueDate.getTime())) return '--';
  if (dueDate.getTime() <= Date.now()) return 'Due now';

  const today = startOfDay(new Date());
  const dueDay = startOfDay(dueDate);
  const dayDiff = Math.max(1, Math.round((dueDay - today) / 86_400_000));

  if (dayDiff === 1) return 'Tomorrow';
  if (dayDiff <= 7) return `In ${dayDiff} days`;

  return dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function MetadataItem({ icon, label, tone }: { icon: ReactNode; label: string; tone: 'neutral' | 'primary' | 'warning' | 'success' }) {
  const { colors } = useAppTheme();
  const toneColor = {
    neutral: colors.muted,
    primary: colors.primary,
    warning: colors.warning,
    success: colors.success,
  }[tone];
  const backgroundColor = tone === 'neutral' ? colors.canvas : `${toneColor}1a`;

  return (
    <View className="min-h-8 flex-row items-center gap-1.5 rounded-md border px-2.5" style={{ backgroundColor, borderColor: colors.border }}>
      {icon}
      <AppText className="text-xs font-medium leading-4" style={{ color: toneColor }}>
        {label}
      </AppText>
    </View>
  );
}

export function WordCard({ word }: { word: WordWithExamples }) {
  const router = useRouter();
  const deleteWord = useDeleteWordMutation();
  const appAlert = useAppAlert();
  const { colors } = useAppTheme();
  const status = getWordStatus(word);
  const statusTone = getStatusTone(status, colors);
  const progressText = getMasteryProgressText(word, status);
  const nextReviewText = getNextReviewText(word.due_at);
  const masteryTone = status === 'Mastered' || status === 'Almost mastered' ? 'success' : status === 'Due' ? 'warning' : 'primary';
  const reviewTone = status === 'Due' ? 'warning' : 'neutral';

  const confirmDelete = () => {
    appAlert.show({
      title: 'Delete this word?',
      message: 'This action cannot be undone.',
      variant: 'danger',
      actions: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteWord.mutate(word.id) },
      ],
    });
  };

  const openActions = () => {
    appAlert.show({
      title: word.word,
      message: 'Choose an action for this word.',
      actions: [
        { text: 'Edit', onPress: () => router.push(`/(protected)/word/${word.id}/edit`) },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        { text: 'Cancel', style: 'cancel' },
      ],
    });
  };

  return (
    <Card className="min-h-[142px] overflow-hidden rounded-lg border p-4 shadow-none" style={{ borderColor: colors.border }}>
      {status === 'Due' ? <View className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: colors.warning }} /> : null}
      <View className={`${status === 'Due' ? 'pl-2' : ''} pr-1`}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <AppText className="text-xl font-semibold leading-7" numberOfLines={1} style={{ color: colors.text }}>{word.word}</AppText>
              <AppText className="rounded px-2 py-0.5 text-[10px] font-medium leading-[15px]" style={{ backgroundColor: statusTone.background, color: statusTone.text }}>
                {status}
              </AppText>
            </View>
            {word.phonetic ? <AppText className="mt-0.5 text-[13px] leading-[18px]" style={{ color: colors.muted }}>{word.phonetic}</AppText> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`More options for ${word.word}`} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.canvas }} onPress={openActions}>
            <MoreVertical color={colors.muted} size={18} />
          </Pressable>
        </View>
        <AppText className="mt-3 text-base leading-6" numberOfLines={2} style={{ color: colors.text }}>
          {word.meaning}
        </AppText>
        <View className="mt-4 flex-row flex-wrap gap-2">
          <MetadataItem icon={<Target color={status === 'Mastered' || status === 'Almost mastered' ? colors.success : status === 'Due' ? colors.warning : colors.primary} size={14} strokeWidth={2.4} />} label={progressText} tone={masteryTone} />
          <MetadataItem icon={<CalendarClock color={status === 'Due' ? colors.warning : colors.muted} size={14} strokeWidth={2.4} />} label={nextReviewText} tone={reviewTone} />
        </View>
      </View>
    </Card>
  );
}

function getStatusTone(status: WordStatus, colors: ReturnType<typeof useAppTheme>['colors']) {
  if (status === 'Due') return { background: '#f59e0b33', text: colors.warning };
  if (status === 'Mastered') return { background: '#22c55e33', text: colors.success };
  if (status === 'Almost mastered') return { background: '#22c55e22', text: colors.success };
  if (status === 'Practicing') return { background: '#f59e0b22', text: colors.warning };
  return { background: colors.primarySoft, text: colors.primary };
}
