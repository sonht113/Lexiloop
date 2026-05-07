import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useProfileStatsQuery() {
  return useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const [profile, words, logs] = await Promise.all([
        supabase.from('profiles').select('*').single(),
        supabase.from('words').select('id, correct_streak'),
        supabase.from('review_logs').select('result, reviewed_at').order('reviewed_at', { ascending: false }),
      ]);

      for (const result of [profile, words, logs]) {
        if (result.error) throw result.error;
      }

      const totalReviews = logs.data?.length ?? 0;
      const remembered = logs.data?.filter((item) => item.result === 'remembered').length ?? 0;
      const masteredWords = words.data?.filter((word) => word.correct_streak >= 5).length ?? 0;

      return {
        profile: profile.data,
        totalWords: words.data?.length ?? 0,
        masteredWords,
        totalReviews,
        accuracy: totalReviews ? Math.round((remembered / totalReviews) * 100) : null,
      };
    },
  });
}
