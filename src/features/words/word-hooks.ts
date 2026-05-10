import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database, WordExampleInput, WordMutationInput } from '@/types/database';

type Word = Database['public']['Tables']['words']['Row'];
type WordExample = Database['public']['Tables']['word_examples']['Row'];

export type WordWithExamples = Word & {
  word_examples?: WordExample[];
};

type WordInput = WordMutationInput;

function normalizeExamples(examples?: WordExampleInput[]) {
  return (examples ?? [])
    .map((example) => ({
      sentence: example.sentence?.trim() ?? '',
      translation: example.translation?.trim() || null,
    }))
    .filter((example) => example.sentence.length > 0)
    .slice(0, 3);
}

export function useWordsQuery(deckId?: string) {
  return useQuery({
    queryKey: ['words', deckId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('words')
        .select('*, word_examples(*)')
        .order('created_at', { ascending: false })
        .order('sort_order', { referencedTable: 'word_examples', ascending: true });
      if (deckId) query = query.eq('deck_id', deckId);
      const { data, error } = await query;
      if (error) throw error;
      return data as WordWithExamples[];
    },
  });
}

export function useWordQuery(wordId?: string) {
  return useQuery({
    queryKey: ['words', 'detail', wordId],
    enabled: Boolean(wordId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('words')
        .select('*, word_examples(*)')
        .eq('id', wordId!)
        .order('sort_order', { referencedTable: 'word_examples', ascending: true })
        .single();
      if (error) throw error;
      return data as WordWithExamples;
    },
  });
}

export function useCreateWordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WordInput) => {
      const examples = normalizeExamples(input.examples);
      const { data, error } = await supabase.rpc('create_word_with_examples', {
        p_input: {
          deck_id: input.deck_id,
          word: input.word,
          meaning: input.meaning,
          examples,
          note: input.note ?? null,
          phonetic: input.phonetic ?? null,
          audio_url: input.audio_url ?? null,
        },
      });
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
    mutationFn: async ({ wordId, input }: { wordId: string; input: WordInput }) => {
      const examples = normalizeExamples(input.examples);
      const { data, error } = await supabase.rpc('update_word_with_examples', {
        p_word_id: wordId,
        p_input: {
          deck_id: input.deck_id,
          word: input.word,
          meaning: input.meaning,
          examples,
          note: input.note ?? null,
          phonetic: input.phonetic ?? null,
          audio_url: input.audio_url ?? null,
        },
      });
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
