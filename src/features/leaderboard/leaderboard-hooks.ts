import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database, LeaderboardMetric, LeaderboardPeriod } from '@/types/database';

export type LeaderboardRow = Database['public']['Functions']['get_leaderboard']['Returns'][number];

export function useLeaderboardQuery(metric: LeaderboardMetric, period: LeaderboardPeriod = 'all_time', limit = 50) {
  return useQuery({
    queryKey: ['leaderboard', metric, period, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_metric: metric,
        p_period: period,
        p_limit: limit,
      });
      if (error) throw error;
      return data;
    },
  });
}
