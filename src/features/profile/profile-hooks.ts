import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useProfileStatsQuery() {
  return useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const [profileResult, statsResult] = await Promise.all([
        supabase.from('profiles').select('*').single(),
        supabase.rpc('get_profile_stats'),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (statsResult.error) throw statsResult.error;

      return {
        profile: profileResult.data,
        totalWords: statsResult.data.total_words,
        masteredWords: statsResult.data.mastered_words,
        totalReviews: statsResult.data.total_reviews,
        accuracy: statsResult.data.accuracy,
        currentStreak: statsResult.data.current_streak,
      };
    },
  });
}
