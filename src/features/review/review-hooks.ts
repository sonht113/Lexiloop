import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AnswerWordReviewResponse, Database, ReviewResult, WeakWordRow } from '@/types/database';

type Deck = Pick<Database['public']['Tables']['decks']['Row'], 'id' | 'name' | 'color' | 'icon'>;
type Word = Database['public']['Tables']['words']['Row'];
type WordExample = Database['public']['Tables']['word_examples']['Row'];

export type ReviewWord = Word & {
  decks: Deck | null;
  word_examples?: WordExample[];
  weak_score?: number;
};

function mapWeakWordRow(row: WeakWordRow): ReviewWord {
  const { decks, word_examples, weak_score, ...word } = row;
  return {
    ...word,
    weak_score,
    decks: decks as Deck | null,
    word_examples: Array.isArray(word_examples) ? (word_examples as WordExample[]) : [],
  };
}

export function useDueWordsQuery(deckId?: string, enabled = true) {
  return useQuery({
    queryKey: ['review', 'due-words', deckId ?? 'daily'],
    enabled,
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

export function usePracticeWordsQuery(deckId?: string, enabled = true) {
  return useQuery({
    queryKey: ['review', 'practice-words', deckId ?? 'all'],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from('words')
        .select('*, decks(id, name, color, icon), word_examples(*)')
        .order('due_at', { ascending: true })
        .order('sort_order', { referencedTable: 'word_examples', ascending: true });

      if (deckId) query = query.eq('deck_id', deckId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ReviewWord[];
    },
  });
}

export function useWeakWordsQuery(deckId?: string, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['review', 'weak-words', deckId ?? 'all', limit],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_weak_words', {
        p_limit: limit,
        p_deck_id: deckId ?? null,
      });
      if (error) throw error;
      return (data as WeakWordRow[]).map(mapWeakWordRow);
    },
  });
}

export function useNewWordsQuery(deckId?: string, limit = 5, enabled = true) {
  return useQuery({
    queryKey: ['review', 'new-words', deckId ?? 'all', limit],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from('words')
        .select('*, decks(id, name, color, icon), word_examples(*)')
        .eq('review_count', 0)
        .order('created_at', { ascending: true })
        .order('sort_order', { referencedTable: 'word_examples', ascending: true })
        .limit(limit);

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
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}
