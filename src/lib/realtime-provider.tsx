import { PropsWithChildren, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export function RealtimeProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('lexiloop-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['decks'] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'words' }, () => {
        queryClient.invalidateQueries({ queryKey: ['words'] });
        queryClient.invalidateQueries({ queryKey: ['review'] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['review'] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminder_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return children;
}
