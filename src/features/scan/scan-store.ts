import { create } from "zustand";

import type { ExtractedWord, ScanError } from "@/features/scan/scan-types";

export type ScanSessionState = {
  deckId: string | null;
  compressedImage: string | null;
  extractedWords: ExtractedWord[];
  selectedIds: Set<string>;
  duplicateIds: Set<string>;
  status:
    | "idle"
    | "compressing"
    | "scanning"
    | "enriching"
    | "reviewing"
    | "inserting";
  insertionProgress: { done: number; total: number };
  error: ScanError | null;
};

type ScanSessionActions = {
  setDeckId: (deckId: string) => void;
  setCompressedImage: (base64: string) => void;
  setExtractedWords: (
    words: ExtractedWord[],
    existingDeckWords: string[],
  ) => void;
  toggleSelection: (wordId: string) => void;
  removeWord: (wordId: string) => void;
  updateWord: (
    wordId: string,
    updates: Partial<Pick<ExtractedWord, "word" | "meaning" | "examples">>,
    existingDeckWords?: string[],
  ) => void;
  setStatus: (status: ScanSessionState["status"]) => void;
  setInsertionProgress: (done: number, total: number) => void;
  setError: (error: ScanError | null) => void;
  reset: () => void;
};

const initialState: ScanSessionState = {
  deckId: null,
  compressedImage: null,
  extractedWords: [],
  selectedIds: new Set(),
  duplicateIds: new Set(),
  status: "idle",
  insertionProgress: { done: 0, total: 0 },
  error: null,
};

function computeDuplicateIds(
  words: ExtractedWord[],
  existingDeckWords: string[],
): Set<string> {
  const normalizedExisting = new Set(
    existingDeckWords.map((w) => w.trim().toLowerCase()),
  );
  const duplicates = new Set<string>();
  for (const word of words) {
    if (normalizedExisting.has(word.word.trim().toLowerCase())) {
      duplicates.add(word.id);
    }
  }
  return duplicates;
}

export const useScanStore = create<ScanSessionState & ScanSessionActions>(
  (set, get) => ({
    ...initialState,

    setDeckId: (deckId) => set({ deckId }),

    setCompressedImage: (base64) => set({ compressedImage: base64 }),

    setExtractedWords: (words, existingDeckWords) => {
      const duplicateIds = computeDuplicateIds(words, existingDeckWords);
      const selectedIds = new Set(
        words.filter((w) => !duplicateIds.has(w.id)).map((w) => w.id),
      );
      set({ extractedWords: words, duplicateIds, selectedIds });
    },

    toggleSelection: (wordId) => {
      const { selectedIds } = get();
      const next = new Set(selectedIds);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      set({ selectedIds: next });
    },

    removeWord: (wordId) => {
      const { extractedWords, selectedIds, duplicateIds } = get();
      const nextWords = extractedWords.filter((w) => w.id !== wordId);
      const nextSelected = new Set(selectedIds);
      nextSelected.delete(wordId);
      const nextDuplicates = new Set(duplicateIds);
      nextDuplicates.delete(wordId);
      set({
        extractedWords: nextWords,
        selectedIds: nextSelected,
        duplicateIds: nextDuplicates,
      });
    },

    updateWord: (wordId, updates, existingDeckWords) => {
      const { extractedWords, duplicateIds, selectedIds } = get();
      const nextWords = extractedWords.map((w) =>
        w.id === wordId ? { ...w, ...updates } : w,
      );

      // Re-evaluate duplicate status when the word field changes
      if (updates.word !== undefined && existingDeckWords) {
        const updatedWord = nextWords.find((w) => w.id === wordId);
        if (updatedWord) {
          const normalizedExisting = new Set(
            existingDeckWords.map((w) => w.trim().toLowerCase()),
          );
          const isDuplicate = normalizedExisting.has(
            updatedWord.word.trim().toLowerCase(),
          );

          const nextDuplicates = new Set(duplicateIds);
          const nextSelected = new Set(selectedIds);

          if (isDuplicate) {
            nextDuplicates.add(wordId);
            nextSelected.delete(wordId);
          } else {
            const wasDuplicate = duplicateIds.has(wordId);
            nextDuplicates.delete(wordId);
            // Auto-select if it was previously a duplicate
            if (wasDuplicate) {
              nextSelected.add(wordId);
            }
          }

          set({
            extractedWords: nextWords,
            duplicateIds: nextDuplicates,
            selectedIds: nextSelected,
          });
        } else {
          set({ extractedWords: nextWords });
        }
      } else {
        set({ extractedWords: nextWords });
      }
    },

    setStatus: (status) => set({ status }),

    setInsertionProgress: (done, total) =>
      set({ insertionProgress: { done, total } }),

    setError: (error) => set({ error }),

    reset: () => set({ ...initialState }),
  }),
);
