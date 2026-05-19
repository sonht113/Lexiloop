import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ensureUserBootstrap } from '@/features/auth/user-bootstrap';
import type { DailyLearningPlan, ReviewForecastRow } from '@/types/database';

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

export function useDailyLearningPlanQuery() {
  return useQuery({
    queryKey: ['home', 'daily-learning-plan'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_learning_plan');
      if (error) throw error;
      return data as DailyLearningPlan;
    },
  });
}

export function useReviewForecastQuery() {
  return useQuery({
    queryKey: ['home', 'review-forecast'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_review_forecast');
      if (error) throw error;
      return data as ReviewForecastRow[];
    },
  });
}
