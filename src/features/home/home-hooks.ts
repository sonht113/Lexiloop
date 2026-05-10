import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ensureUserBootstrap } from '@/features/auth/user-bootstrap';

export function useHomeStatsQuery() {
  return useQuery({
    queryKey: ['home', 'stats'],
    queryFn: async () => {
      const profile = await ensureUserBootstrap();
      const [statsResult, profileResult] = await Promise.all([
        supabase.rpc('get_profile_stats'),
        supabase.from('profiles').select('username').eq('id', profile.id).single(),
      ]);

      if (statsResult.error) throw statsResult.error;
      if (profileResult.error) throw profileResult.error;

      const data = statsResult.data;

      return {
        username: profileResult.data.username,
        dueCount: data.due_count,
        totalWords: data.total_words,
        masteredWords: data.mastered_words,
        totalReviews: data.total_reviews,
        reviewedToday: data.reviewed_today,
        accuracy: data.accuracy,
        currentStreak: data.current_streak,
      };
    },
  });
}
