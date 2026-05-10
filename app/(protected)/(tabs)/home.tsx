import type { ReactNode } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Bell, BookOpen, Flame, Plus, Trophy, Zap } from 'lucide-react-native';
import { AppText, EmptyState } from '@/components/ui';
import { useHomeStatsQuery } from '@/features/home/home-hooks';
import { useAppTheme } from '@/lib/theme-provider';

type QuickActionProps = {
  href: '/(protected)/word/quick-add' | '/(protected)/reminder';
  label: string;
  icon: ReactNode;
  iconBackgroundColor: string;
};

type ProgressStatProps = {
  label: string;
  value: number | string;
  icon: ReactNode;
};

export default function HomeScreen() {
  const stats = useHomeStatsQuery();
  const { colors } = useAppTheme();
  const dueCount = stats.data?.dueCount ?? 0;
  const reviewedToday = stats.data?.reviewedToday ?? 0;
  const totalToday = reviewedToday + dueCount;
  const progress = totalToday === 0 ? 0 : reviewedToday / totalToday;
  const username = stats.data?.username ?? 'Learner';
  const reviewTitle = `${dueCount} ${dueCount === 1 ? 'word' : 'words'} due today`;

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
                Keep up the great work!
              </AppText>
            </View>
            <View className="h-[35px] w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#ffffff33' }}>
              <Zap color="#ffffff" size={18} fill="#ffffff" />
            </View>
          </View>

          <View className="mt-4">
            <View className="flex-row items-center justify-between">
              <AppText className="text-[13px] leading-[18px]" style={{ color: '#dad7ffe5' }}>
                Progress
              </AppText>
              <AppText className="text-[13px] leading-[18px]" style={{ color: '#dad7ffe5' }}>
                {reviewedToday}/{totalToday}
              </AppText>
            </View>
            <View className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: '#00000033' }}>
              <View className="h-2 rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: '#ffffff' }} />
            </View>
          </View>

          {dueCount > 0 ? (
            <Link href="/(protected)/review/session" asChild>
              <Pressable className="mt-4 min-h-12 items-center justify-center rounded-lg" style={{ backgroundColor: '#ffffff' }}>
                <AppText className="text-base font-medium leading-6" style={{ color: colors.primary }}>
                  Start Review
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

        {stats.isError ? <EmptyState title="Could not load stats" description="Please try again later." /> : null}

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
        </View>

        <View>
          <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
            Your Progress
          </AppText>
          <View className="mt-4 flex-row gap-3">
            <ProgressStat
              label="Days Streak"
              value={stats.data?.currentStreak ?? '—'}
              icon={<Flame color={colors.warning} size={18} fill={colors.warning} />}
            />
            <ProgressStat
              label="Total Words"
              value={stats.data?.totalWords ?? '—'}
              icon={<BookOpen color={colors.primary} size={20} strokeWidth={2.3} />}
            />
            <ProgressStat
              label="Mastered"
              value={stats.data?.masteredWords ?? '—'}
              icon={<Trophy color={colors.success} size={21} strokeWidth={2.3} />}
            />
          </View>
        </View>
      </ScrollView>
    </View>
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
