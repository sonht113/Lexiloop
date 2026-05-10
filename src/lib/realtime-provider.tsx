import { PropsWithChildren, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionQuery } from '@/features/auth/auth-hooks';
import { supabase } from './supabase';

export function RealtimeProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const { data: session } = useSessionQuery();

  useEffect(() => {
    if (!session) return;

    const userFilter = `user_id=eq.${session.user.id}`;
    const channel = supabase
      .channel(`lexiloop-realtime-${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decks', filter: userFilter }, () => {
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'words', filter: userFilter }, () => {
        queryClient.invalidateQueries({ queryKey: ['words'] });
        queryClient.invalidateQueries({ queryKey: ['review'] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'word_examples', filter: userFilter }, () => {
        queryClient.invalidateQueries({ queryKey: ['words'] });
        queryClient.invalidateQueries({ queryKey: ['review'] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_logs', filter: userFilter }, () => {
        queryClient.invalidateQueries({ queryKey: ['review'] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminder_settings', filter: userFilter }, () => {
        queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, session]);

  return children;
}
