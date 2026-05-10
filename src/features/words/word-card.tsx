import { useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
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
  return `${progress}/5 to master`;
}

export function WordCard({ word }: { word: WordWithExamples }) {
  const router = useRouter();
  const deleteWord = useDeleteWordMutation();
  const appAlert = useAppAlert();
  const { colors } = useAppTheme();
  const status = getWordStatus(word);
  const statusTone = getStatusTone(status, colors);
  const progressText = getMasteryProgressText(word, status);

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
    <Card className="min-h-[136px] overflow-hidden rounded-lg border p-4 shadow-none" style={{ borderColor: colors.border }}>
      {status === 'Due' ? <View className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: colors.warning }} /> : null}
      <View className={`${status === 'Due' ? 'pl-2' : ''} pr-1`}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>{word.word}</AppText>
              <AppText className="rounded px-2 py-0.5 text-[10px] font-medium leading-[15px]" style={{ backgroundColor: statusTone.background, color: statusTone.text }}>
                {status}
              </AppText>
            </View>
            <View className="mt-1 flex-row flex-wrap items-center gap-2">
              {word.phonetic ? <AppText className="text-[13px] leading-[18px]" style={{ color: colors.muted }}>{word.phonetic}</AppText> : null}
              <AppText className="text-[13px] leading-[18px]" style={{ color: status === 'Mastered' ? colors.success : colors.muted }}>
                {progressText}
              </AppText>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`More options for ${word.word}`} className="h-6 w-6 items-center justify-center" onPress={openActions}>
            <MoreVertical color={colors.muted} size={18} />
          </Pressable>
        </View>
        <AppText className="mt-2 text-base leading-6" numberOfLines={2} style={{ color: colors.text }}>
          {word.meaning}
        </AppText>
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
