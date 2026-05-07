import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useHomeStatsQuery() {
  return useQuery({
    queryKey: ['home', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profile_stats');
      if (error) throw error;
      return {
        dueCount: data.due_count,
        totalWords: data.total_words,
        masteredWords: data.mastered_words,
        totalReviews: data.total_reviews,
        accuracy: data.accuracy,
        currentStreak: data.current_streak,
      };
    },
  });
}
