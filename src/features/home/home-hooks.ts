import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useHomeStatsQuery() {
  return useQuery({
    queryKey: ['home', 'stats'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const [due, total, mastered, reviews] = await Promise.all([
        supabase.from('words').select('id', { count: 'exact', head: true }).lte('due_at', now),
        supabase.from('words').select('id', { count: 'exact', head: true }),
        supabase.from('words').select('id', { count: 'exact', head: true }).gte('correct_streak', 5),
        supabase.from('review_logs').select('result'),
      ]);

      for (const result of [due, total, mastered, reviews]) {
        if (result.error) throw result.error;
      }

      const remembered = reviews.data?.filter((item) => item.result === 'remembered').length ?? 0;
      const reviewCount = reviews.data?.length ?? 0;

      return {
        dueCount: due.count ?? 0,
        totalWords: total.count ?? 0,
        masteredWords: mastered.count ?? 0,
        accuracy: reviewCount ? Math.round((remembered / reviewCount) * 100) : null,
      };
    },
  });
}
