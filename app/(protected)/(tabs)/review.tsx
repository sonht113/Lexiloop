import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { BookOpen, ClipboardCheck, Flame, Layers3, RotateCcw, Target } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { useHomeStatsQuery } from '@/features/home/home-hooks';
import { DEFAULT_LEARNING_SETTINGS, useLearningSettingsQuery } from '@/features/learning-settings/learning-settings-hooks';
import { useDueWordsQuery, useNewWordsQuery, useWeakWordsQuery } from '@/features/review/review-hooks';
import { useAppTheme } from '@/lib/theme-provider';

type ReviewHref =
  | '/(protected)/review/session'
  | '/(protected)/review/session?mode=new'
  | '/(protected)/review/session?mode=weak'
  | '/(protected)/review/session?mode=practice'
  | '/(protected)/word/quick-add';

type Tone = 'primary' | 'success' | 'warning' | 'neutral';

type ReviewActionProps = {
  title: string;
  subtitle: string;
  count: string;
  status: string;
  href: ReviewHref;
  icon: ReactNode;
  tone: Tone;
  disabled?: boolean;
};

type MetricProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

function getToneColor(tone: Tone, colors: ReturnType<typeof useAppTheme>['colors']) {
  if (tone === 'success') return colors.success;
  if (tone === 'warning') return colors.warning;
  if (tone === 'neutral') return colors.muted;
  return colors.primary;
}

function ReviewActionCard({ title, subtitle, count, status, href, icon, tone, disabled }: ReviewActionProps) {
  const { colors } = useAppTheme();
  const toneColor = getToneColor(tone, colors);
  const content = (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`min-h-[116px] rounded-xl border p-4 ${disabled ? 'opacity-55' : ''}`}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="mb-3 h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${toneColor}1a` }}>
            {icon}
          </View>
          <AppText className="text-base font-semibold leading-6" style={{ color: colors.text }}>
            {title}
          </AppText>
          <AppText className="mt-1 text-sm leading-5" numberOfLines={2} style={{ color: colors.muted }}>
            {subtitle}
          </AppText>
        </View>
        <View className="items-end gap-2">
          <AppText className="text-xl font-bold leading-7" style={{ color: toneColor }}>
            {count}
          </AppText>
          <AppText className="rounded-md px-2 py-1 text-[11px] font-semibold leading-4" style={{ backgroundColor: colors.primarySoft, color: colors.primary }}>
            {status}
          </AppText>
        </View>
      </View>
    </Pressable>
  );

  if (disabled) return content;
  return (
    <Link href={href} asChild>
      {content}
    </Link>
  );
}

function Metric({ label, value, icon }: MetricProps) {
  const { colors } = useAppTheme();

  return (
    <View className="min-h-[76px] flex-1 justify-center rounded-lg px-3 py-3" style={{ backgroundColor: colors.primarySoft }}>
      <View className="mb-1 h-5 justify-center">{icon}</View>
      <AppText className="text-lg font-bold leading-6" style={{ color: colors.text }}>
        {value}
      </AppText>
      <AppText className="text-xs leading-4" numberOfLines={1} style={{ color: colors.muted }}>
        {label}
      </AppText>
    </View>
  );
}

export default function ReviewLandingScreen() {
  const dueWords = useDueWordsQuery();
  const learningSettings = useLearningSettingsQuery();
  const dailyNewWordsLimit = learningSettings.data?.daily_new_words_limit ?? DEFAULT_LEARNING_SETTINGS.daily_new_words_limit;
  const dailyWeakWordsLimit = learningSettings.data?.daily_weak_words_limit ?? DEFAULT_LEARNING_SETTINGS.daily_weak_words_limit;
  const newWords = useNewWordsQuery(undefined, dailyNewWordsLimit);
  const weakWords = useWeakWordsQuery(undefined, dailyWeakWordsLimit);
  const stats = useHomeStatsQuery();
  const { colors } = useAppTheme();
  const dueCount = dueWords.data?.length ?? stats.data?.dueCount ?? 0;
  const newCount = newWords.data?.length ?? 0;
  const weakCount = weakWords.data?.length ?? 0;
  const totalWords = stats.data?.totalWords ?? 0;
  const reviewedToday = stats.data?.reviewedToday ?? 0;
  const planQueue = dueCount + newCount + weakCount;
  const planIsLoading = dueWords.isLoading || learningSettings.isLoading || newWords.isLoading || weakWords.isLoading || stats.isLoading;
  const planHasError = dueWords.isError || learningSettings.isError || newWords.isError || weakWords.isError || stats.isError;
  const accuracyLabel = stats.data?.accuracy == null ? '-' : `${stats.data.accuracy}%`;
  const streakLabel = stats.data?.currentStreak ?? '-';
  const recommendation =
    dueCount > 0
      ? {
          title: 'Start daily review',
          subtitle: `${dueCount} scheduled ${dueCount === 1 ? 'word is' : 'words are'} ready now.`,
          href: '/(protected)/review/session' as const,
          label: 'Review Due',
        }
      : newCount > 0
        ? {
            title: 'Learn new words',
            subtitle: `${newCount} new ${newCount === 1 ? 'word is' : 'words are'} waiting in today's batch.`,
            href: '/(protected)/review/session?mode=new' as const,
            label: 'Learn New',
          }
        : weakCount > 0
          ? {
              title: 'Start weak review',
              subtitle: `${weakCount} weak ${weakCount === 1 ? 'word is' : 'words are'} ready for reinforcement.`,
              href: '/(protected)/review/session?mode=weak' as const,
              label: 'Weak Review',
            }
          : totalWords > 0
            ? {
                title: 'All scheduled work is clear',
                subtitle: 'Keep memory warm with a practice-only session.',
                href: '/(protected)/review/session?mode=practice' as const,
                label: 'Practice All',
              }
            : {
                title: 'Build your first review queue',
                subtitle: 'Add words to start learning with spaced repetition.',
                href: '/(protected)/word/quick-add' as const,
                label: 'Add Word',
              };

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-6 pb-8" showsVerticalScrollIndicator={false}>
        <View>
          <AppText className="text-3xl font-bold leading-10" style={{ color: colors.text }}>
            Review
          </AppText>
          <AppText className="mt-1 text-base leading-6" style={{ color: colors.muted }}>
            Choose the right session for today&apos;s workload.
          </AppText>
        </View>

        <View className="overflow-hidden rounded-xl p-5" style={{ backgroundColor: colors.primary }}>
          <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full" style={{ backgroundColor: '#ffffff1a' }} />
          <View className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full" style={{ backgroundColor: '#00000020' }} />
          <AppText className="text-sm font-semibold uppercase leading-5" style={{ color: '#ffffffcc' }}>
            Recommended
          </AppText>
          <AppText className="mt-2 text-2xl font-bold leading-8" style={{ color: '#ffffff' }}>
            {planIsLoading ? 'Loading review plan' : recommendation.title}
          </AppText>
          <AppText className="mt-2 text-base leading-6" style={{ color: '#ffffffcc' }}>
            {planIsLoading ? 'Checking due, new, and weak words.' : recommendation.subtitle}
          </AppText>
          <Link href={recommendation.href} asChild>
            <Pressable
              accessibilityRole="button"
              disabled={planIsLoading || planHasError}
              className={`mt-5 min-h-12 items-center justify-center rounded-lg px-4 ${planIsLoading || planHasError ? 'opacity-60' : ''}`}
              style={{ backgroundColor: '#ffffff' }}
            >
              <AppText className="text-base font-semibold leading-6" style={{ color: colors.primary }}>
                {planIsLoading ? 'Loading' : recommendation.label}
              </AppText>
            </Pressable>
          </Link>
        </View>

        {planHasError ? <EmptyState title="Could not load review plan" description="Please try again later." /> : null}

        <View className="flex-row gap-3">
          <Metric label="Queued" value={planIsLoading ? '-' : planQueue} icon={<ClipboardCheck color={colors.primary} size={18} strokeWidth={2.4} />} />
          <Metric label="Reviewed" value={reviewedToday} icon={<Target color={colors.success} size={18} strokeWidth={2.4} />} />
          <Metric label="Streak" value={streakLabel} icon={<Flame color={colors.warning} fill={colors.warning} size={18} strokeWidth={2.4} />} />
        </View>

        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
              Sessions
            </AppText>
            <AppText className="text-sm leading-5" style={{ color: colors.muted }}>
              Accuracy {accuracyLabel}
            </AppText>
          </View>
          <View className="gap-3">
            <ReviewActionCard
              title="Daily Review"
              subtitle="Clear words that are due now."
              count={planIsLoading ? '-' : String(dueCount)}
              status={dueCount > 0 ? 'Ready' : 'Clear'}
              href="/(protected)/review/session"
              icon={<ClipboardCheck color={colors.primary} size={20} strokeWidth={2.4} />}
              tone="primary"
              disabled={planHasError || dueCount === 0}
            />
            <ReviewActionCard
              title="Learn New"
              subtitle="Introduce fresh words into your schedule."
              count={planIsLoading ? '-' : String(newCount)}
              status={newCount > 0 ? 'Ready' : 'Empty'}
              href="/(protected)/review/session?mode=new"
              icon={<BookOpen color={colors.success} size={20} strokeWidth={2.4} />}
              tone="success"
              disabled={planHasError || newCount === 0}
            />
            <ReviewActionCard
              title="Weak Review"
              subtitle="Practice weak words without changing due dates."
              count={planIsLoading ? '-' : String(weakCount)}
              status={weakCount > 0 ? 'Ready' : 'Clear'}
              href="/(protected)/review/session?mode=weak"
              icon={<RotateCcw color={colors.warning} size={20} strokeWidth={2.4} />}
              tone="warning"
              disabled={planHasError || weakCount === 0}
            />
            <ReviewActionCard
              title="Practice All"
              subtitle="Practice without changing review dates."
              count={planIsLoading ? '-' : String(totalWords)}
              status={totalWords > 0 ? 'Open' : 'Empty'}
              href="/(protected)/review/session?mode=practice"
              icon={<Layers3 color={colors.muted} size={20} strokeWidth={2.4} />}
              tone="neutral"
              disabled={planHasError || totalWords === 0}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
