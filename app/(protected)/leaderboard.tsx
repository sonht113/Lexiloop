import { useRouter } from 'expo-router';
import { Award, ChevronLeft, Medal, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { getProfileAvatarPublicUrl } from '@/features/profile/profile-hooks';
import { useLeaderboardQuery, type LeaderboardRow } from '@/features/leaderboard/leaderboard-hooks';
import { useAppTheme } from '@/lib/theme-provider';
import type { LeaderboardMetric } from '@/types/database';

const metricOptions: { label: string; value: LeaderboardMetric }[] = [
  { label: 'Mastered', value: 'mastered' },
  { label: 'Words Added', value: 'words' },
];

function getRankTone(rank: number, colors: ReturnType<typeof useAppTheme>['colors']) {
  if (rank === 1) return colors.warning;
  if (rank === 2) return colors.muted;
  if (rank === 3) return colors.primary;
  return colors.text;
}

function MetricSwitch({ value, onChange }: { value: LeaderboardMetric; onChange: (value: LeaderboardMetric) => void }) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.primarySoft }}>
      {metricOptions.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className="min-h-10 flex-1 items-center justify-center rounded-lg px-3"
            style={{ backgroundColor: selected ? colors.primary : 'transparent' }}
            onPress={() => onChange(option.value)}
          >
            <AppText className="text-sm font-semibold leading-5" style={{ color: selected ? '#ffffff' : colors.primary }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function LeaderboardItem({ row, metric }: { row: LeaderboardRow; metric: LeaderboardMetric }) {
  const { colors } = useAppTheme();
  const avatarUrl = getProfileAvatarPublicUrl(row.avatar_url);
  const rankColor = getRankTone(row.rank, colors);
  const primaryValue = metric === 'mastered' ? row.mastered_words : row.total_words;
  const primaryLabel = metric === 'mastered' ? 'mastered' : 'words';

  return (
    <View
      className="min-h-[84px] flex-row items-center rounded-xl border px-4 py-3"
      style={{
        backgroundColor: row.is_current_user ? colors.primarySoft : colors.surface,
        borderColor: row.is_current_user ? colors.primary : colors.border,
      }}
    >
      <View className="w-10 items-center">
        {row.rank <= 3 ? <Medal color={rankColor} size={24} strokeWidth={2.5} /> : null}
        <AppText className="text-base font-bold leading-6" style={{ color: rankColor }}>
          #{row.rank}
        </AppText>
      </View>
      <View className="ml-3 h-12 w-12 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: colors.primarySoft }}>
        {avatarUrl ? (
          <Image className="h-full w-full" source={{ uri: avatarUrl }} resizeMode="cover" />
        ) : (
          <AppText className="text-lg font-bold" style={{ color: colors.primary }}>
            {row.username.slice(0, 1).toUpperCase()}
          </AppText>
        )}
      </View>
      <View className="ml-4 min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <AppText className="text-base font-semibold leading-6" numberOfLines={1} style={{ color: colors.text }}>
            {row.username}
          </AppText>
          {row.is_current_user ? (
            <AppText className="rounded px-2 py-0.5 text-[10px] font-bold leading-[15px]" style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
              You
            </AppText>
          ) : null}
        </View>
        <AppText className="text-sm leading-5" style={{ color: colors.muted }}>
          {row.mastered_words} mastered | {row.total_words} words | {row.current_streak} streak
        </AppText>
      </View>
      <View className="items-end">
        <AppText className="text-xl font-bold leading-7" style={{ color: colors.text }}>
          {primaryValue}
        </AppText>
        <AppText className="text-xs leading-4" style={{ color: colors.muted }}>
          {primaryLabel}
        </AppText>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [metric, setMetric] = useState<LeaderboardMetric>('mastered');
  const leaderboard = useLeaderboardQuery(metric, 50);
  const rows = leaderboard.data ?? [];

  return (
    <Screen className="px-0" style={{ backgroundColor: colors.canvas }}>
      <View className="h-16 flex-row items-center px-5" style={{ backgroundColor: colors.elevated }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
          onPress={() => router.back()}
        >
          <ChevronLeft color={colors.muted} size={20} strokeWidth={2.6} />
        </Pressable>
        <AppText className="flex-1 px-4 text-center text-2xl font-bold leading-8" style={{ color: colors.text }}>
          Leaderboard
        </AppText>
        <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.primarySoft }}>
          <Trophy color={colors.primary} size={19} strokeWidth={2.5} />
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-6" showsVerticalScrollIndicator={false}>
        <View className="rounded-xl border p-5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: colors.primarySoft }}>
              <Award color={colors.primary} size={20} strokeWidth={2.5} />
            </View>
            <View className="min-w-0 flex-1">
              <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
                Community ranking
              </AppText>
              <AppText className="text-sm leading-5" style={{ color: colors.muted }}>
                Public aggregate stats from LexiLoop learners.
              </AppText>
            </View>
          </View>
          <View className="mt-4">
            <MetricSwitch value={metric} onChange={setMetric} />
          </View>
        </View>

        {leaderboard.isLoading ? <AppText style={{ color: colors.muted }}>Loading leaderboard...</AppText> : null}
        {leaderboard.isError ? <EmptyState title="Could not load leaderboard" description="Please try again later." /> : null}
        {!leaderboard.isLoading && !leaderboard.isError && rows.length === 0 ? (
          <EmptyState title="No rankings yet" description="Add and review words to appear here." />
        ) : null}
        <View className="gap-3">
          {rows.map((row) => <LeaderboardItem key={row.user_id} row={row} metric={metric} />)}
        </View>
      </ScrollView>
    </Screen>
  );
}
