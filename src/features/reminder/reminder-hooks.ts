import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useReminderSettingsQuery() {
  return useQuery({
    queryKey: ['reminder-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reminder_settings').select('*').single();
      if (error) throw error;
      return data;
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
        .upsert({ user_id: userData.user.id, ...input })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminder-settings'] }),
  });
}
