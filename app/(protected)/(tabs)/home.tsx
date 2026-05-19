import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Bell, BookOpen, CalendarDays, ClipboardCheck, Flame, Plus, RotateCcw, Trophy, Users, Zap } from 'lucide-react-native';
import { AppText, EmptyState } from '@/components/ui';
import { useDailyLearningPlanQuery, useReviewForecastQuery } from '@/features/home/home-hooks';
import { useAppTheme } from '@/lib/theme-provider';

type QuickActionProps = {
  href: '/(protected)/word/quick-add' | '/(protected)/reminder' | '/(protected)/leaderboard';
  label: string;
  icon: ReactNode;
  iconBackgroundColor: string;
};

type ReviewSessionHref = '/(protected)/review/session' | '/(protected)/review/session?mode=new' | '/(protected)/review/session?mode=weak';

type PlanTaskProps = {
  title: string;
  subtitle: string;
  status: string;
  href?: ReviewSessionHref;
  icon: ReactNode;
  disabled?: boolean;
};

type ProgressStatProps = {
  label: string;
  value: number | string;
  icon: ReactNode;
};

type ForecastStatProps = {
  label: string;
  value: number | string;
  icon: ReactNode;
};

export default function HomeScreen() {
  const plan = useDailyLearningPlanQuery();
  const forecast = useReviewForecastQuery();
  const { colors } = useAppTheme();
  const dueCount = plan.data?.due_count ?? 0;
  const newCount = plan.data?.available_new_words ?? 0;
  const weakCount = plan.data?.available_weak_words ?? 0;
  const forecastRows = forecast.data ?? [];
  const forecastTotal = forecastRows.reduce((total, row) => total + row.review_count, 0);
  const forecastToday = forecastRows.find((row) => row.period === 'today')?.review_count ?? (forecast.isLoading ? '...' : 0);
  const forecastTomorrow = forecastRows.find((row) => row.period === 'tomorrow')?.review_count ?? (forecast.isLoading ? '...' : 0);
  const forecastNextSeven = forecastRows.find((row) => row.period === 'next_7_days')?.review_count ?? (forecast.isLoading ? '...' : 0);
  const reviewedToday = plan.data?.reviewed_today ?? 0;
  const dailyReviewTarget = plan.data?.daily_review_target ?? 0;
  const remainingToday = plan.data?.remaining_today ?? 0;
  const progress = (plan.data?.completion_percent ?? 0) / 100;
  const progressText = plan.data ? `${reviewedToday}/${dailyReviewTarget}` : 'Loading';
  const username = plan.data?.username ?? 'Learner';
  const planIsLoading = plan.isLoading;
  const planHasError = plan.isError;
  const reviewTitle = planIsLoading
    ? 'Loading today plan'
    : remainingToday > 0
      ? `${remainingToday} ${remainingToday === 1 ? 'task' : 'tasks'} in today's plan`
      : 'All caught up';
  const primaryAction: { href: ReviewSessionHref; label: string } | null =
    plan.data?.next_recommended_action === 'review_due'
      ? { href: '/(protected)/review/session', label: 'Start Review' }
      : plan.data?.next_recommended_action === 'learn_new'
        ? { href: '/(protected)/review/session?mode=new', label: 'Learn New' }
        : plan.data?.next_recommended_action === 'practice_weak'
          ? { href: '/(protected)/review/session?mode=weak', label: 'Weak Review' }
          : null;

  return (
    <View className="flex-1 px-5" style={{ backgroundColor: colors.canvas }}>
      <ScrollView contentContainerClassName="gap-6 pb-8 pt-6" showsVerticalScrollIndicator={false}>
        <View>
          <AppText className="text-[32px] font-bold leading-10" style={{ color: colors.text }}>
            Hi {username}
          </AppText>
          <AppText className="mt-1 text-base leading-6" style={{ color: colors.muted }}>
            Ready to review your words?
          </AppText>
        </View>

        <View className="min-h-[222px] overflow-hidden rounded-xl p-6" style={{ backgroundColor: colors.primary }}>
          <View className="absolute -right-10 -top-10 h-32 w-32 rounded-full" style={{ backgroundColor: '#ffffff1a' }} />
          <View className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full" style={{ backgroundColor: '#ffffff1a' }} />

          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <AppText className="text-2xl font-bold leading-8" style={{ color: '#ffffff' }}>
                {reviewTitle}
              </AppText>
              <AppText className="mt-1 text-base leading-6" style={{ color: '#dad7ffcc' }}>
                {remainingToday > 0 ? 'Follow the plan to keep your reviews fresh.' : 'No review tasks are waiting right now.'}
              </AppText>
            </View>
            <View className="h-[35px] w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#ffffff33' }}>
              <Zap color="#ffffff" size={18} fill="#ffffff" />
            </View>
          </View>

          <View className="mt-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1 pr-3">
                <AppText numberOfLines={1} maxFontSizeMultiplier={1.15} className="w-full text-[13px] font-medium leading-[18px]" style={{ color: '#dad7ffe5', paddingRight: 6 }}>
                  Progress
                </AppText>
              </View>
              <View className="min-w-[92px] items-end pl-3">
                <AppText numberOfLines={1} maxFontSizeMultiplier={1.15} className="w-full text-right text-[13px] font-semibold leading-[18px]" style={{ color: '#dad7ffe5', paddingRight: 6 }}>
                  {progressText}
                </AppText>
              </View>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: '#00000033' }}>
              <View className="h-2 rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: '#ffffff' }} />
            </View>
          </View>

          {primaryAction ? (
            <Link href={primaryAction.href} asChild>
              <Pressable className="mt-4 min-h-12 items-center justify-center rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                <AppText className="text-base font-medium leading-6" style={{ color: colors.primary }}>
                  {primaryAction.label}
                </AppText>
              </Pressable>
            </Link>
          ) : (
            <Pressable disabled className="mt-4 min-h-12 items-center justify-center rounded-lg opacity-80" style={{ backgroundColor: '#ffffff' }}>
              <AppText className="text-base font-medium leading-6" style={{ color: colors.primary }}>
                All caught up
              </AppText>
            </Pressable>
          )}
        </View>

        {planHasError ? <EmptyState title="Could not load daily plan" description="Please try again later." /> : null}

        <View>
          <View className="flex-row items-center justify-between">
            <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
              Today&apos;s Plan
            </AppText>
            <AppText className="text-sm leading-5" style={{ color: colors.muted }}>
              {planIsLoading ? 'Loading' : remainingToday === 0 ? 'All clear' : 'Keep momentum'}
            </AppText>
          </View>
          <View className="mt-4 gap-3">
            <PlanTask
              title="Review Due"
              subtitle={dueCount > 0 ? `${dueCount} words ready for spaced review` : 'No due words right now'}
              status={dueCount > 0 ? 'Ready' : 'Done'}
              href="/(protected)/review/session"
              disabled={planHasError || dueCount === 0}
              icon={<ClipboardCheck color={colors.primary} size={18} strokeWidth={2.4} />}
            />
            <PlanTask
              title="Learn New"
              subtitle={newCount > 0 ? `${newCount} new words in today's batch` : 'Add words or come back later'}
              status={newCount > 0 ? 'Ready' : 'Empty'}
              href="/(protected)/review/session?mode=new"
              disabled={planHasError || newCount === 0}
              icon={<BookOpen color={colors.success} size={18} strokeWidth={2.4} />}
            />
            <PlanTask
              title="Weak Review"
              subtitle={weakCount > 0 ? `${weakCount} weak words to practice` : 'No weak words to practice'}
              status={weakCount > 0 ? 'Ready' : 'Done'}
              href="/(protected)/review/session?mode=weak"
              disabled={planHasError || weakCount === 0}
              icon={<RotateCcw color={colors.warning} size={18} strokeWidth={2.4} />}
            />
          </View>
        </View>

        <View>
          <View className="flex-row items-center justify-between">
            <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
              Upcoming Reviews
            </AppText>
            <AppText className="text-sm leading-5" style={{ color: colors.muted }}>
              {forecast.isLoading ? 'Loading' : forecast.isError ? 'Unavailable' : forecastTotal === 0 ? 'All clear' : `${forecastTotal} scheduled`}
            </AppText>
          </View>
          {forecast.isError ? (
            <View className="mt-4 min-h-[74px] justify-center rounded-xl border px-4 py-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <AppText className="text-sm leading-5" style={{ color: colors.muted }}>
                Could not load review forecast.
              </AppText>
            </View>
          ) : (
            <>
              <View className="mt-4 flex-row gap-3">
                <ForecastStat label="Today" value={forecastToday} icon={<CalendarDays color={colors.primary} size={18} strokeWidth={2.4} />} />
                <ForecastStat label="Tomorrow" value={forecastTomorrow} icon={<CalendarDays color={colors.warning} size={18} strokeWidth={2.4} />} />
                <ForecastStat label="Next 7 Days" value={forecastNextSeven} icon={<CalendarDays color={colors.success} size={18} strokeWidth={2.4} />} />
              </View>
              {!forecast.isLoading && forecastTotal === 0 ? (
                <AppText className="mt-3 text-sm leading-5" style={{ color: colors.muted }}>
                  No upcoming reviews scheduled.
                </AppText>
              ) : null}
            </>
          )}
        </View>

        <View className="flex-row gap-4">
          <QuickAction
            href="/(protected)/word/quick-add"
            label="Quick Add"
            icon={<Plus color={colors.primary} size={16} strokeWidth={2.4} />}
            iconBackgroundColor={colors.primarySoft}
          />
          <QuickAction
            href="/(protected)/reminder"
            label="Reminder"
            icon={<Bell color={colors.primary} size={18} strokeWidth={2.4} />}
            iconBackgroundColor={colors.primarySoft}
          />
          <QuickAction
            href="/(protected)/leaderboard"
            label="Rank"
            icon={<Users color={colors.primary} size={18} strokeWidth={2.4} />}
            iconBackgroundColor={colors.primarySoft}
          />
        </View>

        <View>
          <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
            Your Progress
          </AppText>
          <View className="mt-4 flex-row gap-3">
            <ProgressStat
              label="Days Streak"
              value={plan.data?.current_streak ?? '-'}
              icon={<Flame color={colors.warning} size={18} fill={colors.warning} />}
            />
            <ProgressStat
              label="Total Words"
              value={plan.data?.total_words ?? '-'}
              icon={<BookOpen color={colors.primary} size={20} strokeWidth={2.3} />}
            />
            <ProgressStat
              label="Mastered"
              value={plan.data?.mastered_words ?? '-'}
              icon={<Trophy color={colors.success} size={21} strokeWidth={2.3} />}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PlanTask({ title, subtitle, status, href, icon, disabled }: PlanTaskProps) {
  const { colors } = useAppTheme();
  const content = (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={`min-h-[74px] flex-row items-center rounded-xl border px-4 py-3 shadow-sm ${disabled ? 'opacity-60' : ''}`}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.primarySoft }}>
        {icon}
      </View>
      <View className="ml-4 min-w-0 flex-1">
        <AppText className="text-base font-semibold leading-6" style={{ color: colors.text }}>
          {title}
        </AppText>
        <AppText className="text-sm leading-5" numberOfLines={2} style={{ color: colors.muted }}>
          {subtitle}
        </AppText>
      </View>
      <AppText className="ml-3 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: colors.primarySoft, color: colors.primary }}>
        {status}
      </AppText>
    </Pressable>
  );

  if (!href || disabled) return content;
  return (
    <Link href={href} asChild>
      {content}
    </Link>
  );
}

function QuickAction({ href, label, icon, iconBackgroundColor }: QuickActionProps) {
  const { colors } = useAppTheme();

  return (
    <Link href={href} asChild>
      <Pressable
        className="min-h-[104px] flex-1 items-center justify-center rounded-xl border px-4 py-4 shadow-sm"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        accessibilityRole="button"
      >
        <View className="h-[38px] w-[38px] items-center justify-center rounded-full" style={{ backgroundColor: iconBackgroundColor }}>
          {icon}
        </View>
        <AppText className="mt-2 text-center text-base font-medium leading-6" style={{ color: colors.text }}>
          {label}
        </AppText>
      </Pressable>
    </Link>
  );
}

function ProgressStat({ label, value, icon }: ProgressStatProps) {
  const { colors } = useAppTheme();

  return (
    <View
      className="min-h-[102px] flex-1 items-center justify-center rounded-xl border p-3 shadow-sm"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="mb-1 h-6 items-center justify-center">{icon}</View>
      <AppText className="text-center text-2xl font-bold leading-8" style={{ color: colors.text }}>
        {value}
      </AppText>
      <AppText className="mt-1 text-center text-[13px] leading-[18px]" style={{ color: colors.muted }}>
        {label}
      </AppText>
    </View>
  );
}

function ForecastStat({ label, value, icon }: ForecastStatProps) {
  const { colors } = useAppTheme();

  return (
    <View className="min-h-[94px] flex-1 items-center justify-center rounded-xl border p-3 shadow-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="mb-1 h-6 items-center justify-center">{icon}</View>
      <AppText className="text-center text-2xl font-bold leading-8" style={{ color: colors.text }}>
        {value}
      </AppText>
      <AppText numberOfLines={2} className="mt-1 text-center text-[12px] leading-4" style={{ color: colors.muted }}>
        {label}
      </AppText>
    </View>
  );
}
