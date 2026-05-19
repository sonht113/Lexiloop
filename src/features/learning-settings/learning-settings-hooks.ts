import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const DEFAULT_LEARNING_SETTINGS = {
  daily_new_words_limit: 5,
  daily_weak_words_limit: 10,
  daily_review_target: 20,
} as const;

export const LEARNING_SETTINGS_LIMITS = {
  daily_new_words_limit: { min: 1, max: 50 },
  daily_weak_words_limit: { min: 1, max: 100 },
  daily_review_target: { min: 1, max: 200 },
} as const;

export type LearningSettingsInput = {
  daily_new_words_limit: number;
  daily_weak_words_limit: number;
  daily_review_target: number;
};

async function getCurrentUserId() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Not authenticated');
  return userData.user.id;
}

export function useLearningSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['learning-settings'],
    enabled,
    queryFn: async () => {
      const userId = await getCurrentUserId();

      const { data, error } = await supabase.from('learning_settings').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (data) return data;

      const { data: createdData, error: createdError } = await supabase
        .from('learning_settings')
        .upsert({ user_id: userId, ...DEFAULT_LEARNING_SETTINGS }, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (createdError) throw createdError;
      return createdData;
    },
  });
}

export function useUpdateLearningSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LearningSettingsInput) => {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from('learning_settings')
        .upsert({ user_id: userId, ...input }, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-settings'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
