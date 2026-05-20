import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { submitScan, fetchScanQuota } from "@/features/scan/scan-service";
import type {
  ScanRequest,
  ScanResponse,
  ScanQuotaResponse,
  ScanError,
  ExtractedWord,
  BulkInsertResult,
} from "@/features/scan/scan-types";
import { useScanStore } from "@/features/scan/scan-store";

export type BulkInsertInput = {
  words: ExtractedWord[];
  deckId: string;
};

export function useScanQuotaQuery(deckId: string | undefined) {
  return useQuery<ScanQuotaResponse>({
    queryKey: ["scan-quota"],
    queryFn: fetchScanQuota,
    enabled: deckId !== undefined,
  });
}

export function useScanMutation() {
  const queryClient = useQueryClient();

  return useMutation<ScanResponse, ScanError, ScanRequest>({
    mutationFn: submitScan,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-quota"] });
    },
  });
}

export function useBulkInsertMutation() {
  const queryClient = useQueryClient();

  return useMutation<BulkInsertResult, Error, BulkInsertInput>({
    mutationFn: async ({ words, deckId }) => {
      const { setInsertionProgress } = useScanStore.getState();
      const total = words.length;
      let inserted = 0;
      let skipped = 0;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];

        const { error } = await supabase.rpc("create_word_with_examples", {
          p_input: {
            deck_id: deckId,
            word: word.word,
            meaning: word.meaning,
            examples: word.examples.map((e) => ({
              sentence: e.sentence,
              translation: e.translation || null,
            })),
            note: null,
            phonetic: word.phonetic || null,
            audio_url: word.audioUrl || null,
          },
        });

        if (error) {
          if (error.code === "23505") {
            skipped++;
          } else {
            // Stop on non-duplicate error, return remaining words
            const remainingWords = words.slice(i + 1);
            setInsertionProgress(inserted + skipped, total);
            return {
              inserted,
              skipped,
              failed: 1,
              remainingWords,
            };
          }
        } else {
          inserted++;
        }

        setInsertionProgress(inserted + skipped, total);
      }

      return {
        inserted,
        skipped,
        failed: 0,
        remainingWords: [],
      };
    },
    onSuccess: (result) => {
      if (result.failed === 0) {
        queryClient.invalidateQueries({ queryKey: ["words"] });
        queryClient.invalidateQueries({ queryKey: ["decks"] });
        queryClient.invalidateQueries({ queryKey: ["home"] });
        queryClient.invalidateQueries({ queryKey: ["review"] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        queryClient.invalidateQueries({ queryKey: ["scan-quota"] });
      }
    },
  });
}
