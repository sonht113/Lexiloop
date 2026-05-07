import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDecksQuery() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('decks').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useDeckQuery(deckId?: string) {
  return useQuery({
    queryKey: ['decks', deckId],
    enabled: Boolean(deckId),
    queryFn: async () => {
      const { data, error } = await supabase.from('decks').select('*').eq('id', deckId).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDeckMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string | null; icon?: string | null; color?: string | null }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('decks')
        .insert({ user_id: userData.user.id, ...input })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decks'] }),
  });
}

export function useUpdateDeckMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deckId, input }: { deckId: string; input: { name?: string; description?: string | null; icon?: string | null; color?: string | null } }) => {
      const { data, error } = await supabase.from('decks').update(input).eq('id', deckId).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (deck) => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['decks', deck.id] });
    },
  });
}

export function useDeleteDeckMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deckId: string) => {
      const { error } = await supabase.from('decks').delete().eq('id', deckId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}
