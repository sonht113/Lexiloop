import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const defaultReminderSettings = {
  enabled: false,
  time: '20:00',
  repeat_days: [0, 1, 2, 3, 4, 5, 6],
  message: 'Time for your LexiLoop review.',
};

export function useReminderSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: ['reminder-settings'],
    enabled,
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('reminder_settings').select('*').eq('user_id', userData.user.id).maybeSingle();
      if (error) throw error;
      if (data) return data;

      const { data: createdData, error: createdError } = await supabase
        .from('reminder_settings')
        .upsert({ user_id: userData.user.id, ...defaultReminderSettings }, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (createdError) throw createdError;
      return createdData;
    },
  });
}

export function useUpdateReminderSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { enabled?: boolean; time?: string; repeat_days?: number[]; message?: string }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reminder_settings')
        .upsert({ user_id: userData.user.id, ...input }, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminder-settings'] }),
  });
}
