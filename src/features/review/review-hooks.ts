import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AnswerWordReviewResponse, Database, ReviewResult } from '@/types/database';

type Deck = Pick<Database['public']['Tables']['decks']['Row'], 'id' | 'name' | 'color' | 'icon'>;
type Word = Database['public']['Tables']['words']['Row'];
type WordExample = Database['public']['Tables']['word_examples']['Row'];

export type ReviewWord = Word & {
  decks: Deck | null;
  word_examples?: WordExample[];
};

export function useDueWordsQuery(deckId?: string) {
  return useQuery({
    queryKey: ['review', 'due-words', deckId ?? 'daily'],
    queryFn: async () => {
      let query = supabase
        .from('words')
        .select('*, decks(id, name, color, icon), word_examples(*)')
        .lte('due_at', new Date().toISOString())
        .order('due_at', { ascending: true })
        .order('sort_order', { referencedTable: 'word_examples', ascending: true });

      if (deckId) query = query.eq('deck_id', deckId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ReviewWord[];
    },
  });
}

export function useAnswerWordReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordId, result }: { wordId: string; result: ReviewResult }) => {
      const { data, error } = await supabase.rpc('answer_word_review', {
        p_word_id: wordId,
        p_result: result,
      });
      if (error) throw error;
      return data as AnswerWordReviewResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
    },
  });
}
