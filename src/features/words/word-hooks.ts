import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useWordsQuery(deckId?: string) {
  return useQuery({
    queryKey: ['words', deckId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('words').select('*').order('created_at', { ascending: false });
      if (deckId) query = query.eq('deck_id', deckId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useWordQuery(wordId?: string) {
  return useQuery({
    queryKey: ['words', 'detail', wordId],
    enabled: Boolean(wordId),
    queryFn: async () => {
      const { data, error } = await supabase.from('words').select('*').eq('id', wordId!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      deck_id: string;
      word: string;
      meaning: string;
      example?: string | null;
      note?: string | null;
      phonetic?: string | null;
      audio_url?: string | null;
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('words')
        .insert({ user_id: userData.user.id, ...input })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
    },
  });
}

export function useUpdateWordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, input }: { wordId: string; input: Partial<{ deck_id: string; word: string; meaning: string; example: string | null; note: string | null; phonetic: string | null; audio_url: string | null }> }) => {
      const { data, error } = await supabase.from('words').update(input).eq('id', wordId).select('*').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (word) => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['words', 'detail', word.id] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useDeleteWordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wordId: string) => {
      const { error } = await supabase.from('words').delete().eq('id', wordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
