import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Platform,
  View,
} from "react-native";

import { AppText, Button, Screen } from "@/components/ui";
import { useBulkInsertMutation } from "@/features/scan/scan-hooks";
import { useScanStore } from "@/features/scan/scan-store";
import { ScanWordItem } from "@/features/scan/scan-word-item";
import { useWordsQuery } from "@/features/words/word-hooks";
import { useAppTheme } from "@/lib/theme-provider";

import type {
  BulkInsertResult,
  ExtractedWord,
} from "@/features/scan/scan-types";

export function ScanReviewScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const listRef = useRef<FlatList<ExtractedWord>>(null);

  const extractedWords = useScanStore((s) => s.extractedWords);
  const selectedIds = useScanStore((s) => s.selectedIds);
  const duplicateIds = useScanStore((s) => s.duplicateIds);
  const status = useScanStore((s) => s.status);
  const insertionProgress = useScanStore((s) => s.insertionProgress);
  const toggleSelection = useScanStore((s) => s.toggleSelection);
  const removeWord = useScanStore((s) => s.removeWord);
  const updateWord = useScanStore((s) => s.updateWord);
  const setStatus = useScanStore((s) => s.setStatus);
  const reset = useScanStore((s) => s.reset);
  const deckId = useScanStore((s) => s.deckId);

  const [validationTriggered, setValidationTriggered] = useState(false);
  const [insertionResult, setInsertionResult] =
    useState<BulkInsertResult | null>(null);

  const bulkInsert = useBulkInsertMutation();

  // Fetch existing deck words for duplicate detection re-evaluation
  const { data: existingWordsData, isError: existingWordsError } =
    useWordsQuery(deckId ?? undefined);

  // Compute the list of existing word strings for duplicate comparison
  const existingDeckWords = useMemo(() => {
    if (!existingWordsData) return [];
    return existingWordsData.map((w) => w.word);
  }, [existingWordsData]);

  const selectedCount = selectedIds.size;
  const allDuplicates =
    extractedWords.length > 0 &&
    extractedWords.every((w) => duplicateIds.has(w.id));

  // Prevent back navigation during insertion (Android)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (status !== "inserting") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true, // returning true prevents default back behavior
    );
    return () => subscription.remove();
  }, [status]);

  const handleCancel = useCallback(() => {
    if (status === "inserting") return; // prevent cancel during insertion
    reset();
    if (deckId) {
      router.replace(`/(protected)/deck/${deckId}` as never);
    } else {
      router.back();
    }
  }, [reset, deckId, router, status]);

  const handleConfirm = useCallback(() => {
    // Validate selected words
    const selectedWords = extractedWords.filter((w) => selectedIds.has(w.id));
    const hasInvalid = selectedWords.some(
      (w) => !w.word.trim() || !w.meaning.trim(),
    );
    if (hasInvalid) {
      setValidationTriggered(true);
      return;
    }

    // Start insertion
    setStatus("inserting");
    bulkInsert.mutate(
      { words: selectedWords, deckId: deckId! },
      {
        onSuccess: (result) => {
          setInsertionResult(result);
          if (result.failed === 0) {
            if (result.skipped > 0) {
              // Show summary for skipped words before navigating
              setStatus("reviewing");
              Alert.alert(
                "Words Added",
                `Added ${result.inserted} words. ${result.skipped} skipped as duplicates.`,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      reset();
                      router.replace(`/(protected)/deck/${deckId}` as never);
                    },
                  },
                ],
              );
            } else {
              // All inserted, no skips — navigate directly
              setStatus("reviewing");
              reset();
              router.replace(`/(protected)/deck/${deckId}` as never);
            }
          }
          // If failed > 0, we stay on screen and show error with resume
        },
        onError: () => {
          // Unexpected error — show generic error with resume
          setInsertionResult({
            inserted: insertionProgress.done,
            skipped: 0,
            failed: 1,
            remainingWords: extractedWords.filter((w) => selectedIds.has(w.id)),
          });
          setStatus("reviewing");
        },
      },
    );
  }, [
    extractedWords,
    selectedIds,
    deckId,
    setStatus,
    bulkInsert,
    reset,
    router,
    insertionProgress.done,
  ]);

  const handleResume = useCallback(() => {
    if (!insertionResult || insertionResult.remainingWords.length === 0) return;

    setStatus("inserting");
    bulkInsert.mutate(
      { words: insertionResult.remainingWords, deckId: deckId! },
      {
        onSuccess: (result) => {
          const totalInserted =
            (insertionResult.inserted ?? 0) + result.inserted;
          const totalSkipped = (insertionResult.skipped ?? 0) + result.skipped;
          const combinedResult: BulkInsertResult = {
            inserted: totalInserted,
            skipped: totalSkipped,
            failed: result.failed,
            remainingWords: result.remainingWords,
          };
          setInsertionResult(combinedResult);
          if (result.failed === 0) {
            if (totalSkipped > 0) {
              // Show summary for skipped words before navigating
              setStatus("reviewing");
              Alert.alert(
                "Words Added",
                `Added ${totalInserted} words. ${totalSkipped} skipped as duplicates.`,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      reset();
                      router.replace(`/(protected)/deck/${deckId}` as never);
                    },
                  },
                ],
              );
            } else {
              setStatus("reviewing");
              reset();
              router.replace(`/(protected)/deck/${deckId}` as never);
            }
          }
        },
        onError: () => {
          setStatus("reviewing");
        },
      },
    );
  }, [insertionResult, deckId, setStatus, bulkInsert, reset, router]);

  const handleToggle = useCallback(
    (wordId: string) => {
      toggleSelection(wordId);
    },
    [toggleSelection],
  );

  const handleRemove = useCallback(
    (wordId: string) => {
      removeWord(wordId);
    },
    [removeWord],
  );

  const handleUpdate = useCallback(
    (
      wordId: string,
      updates: Partial<Pick<ExtractedWord, "word" | "meaning" | "examples">>,
    ) => {
      updateWord(wordId, updates, existingDeckWords);
    },
    [updateWord, existingDeckWords],
  );

  // Focus management: scroll to top when screen mounts
  useEffect(() => {
    if (extractedWords.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [extractedWords.length]);

  // Empty state: no words to review
  if (status === "reviewing" && extractedWords.length === 0) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <AppText
            className="text-lg font-semibold"
            style={{ color: colors.text }}
            accessibilityRole="alert"
          >
            No words to review
          </AppText>
          <AppText
            className="text-center text-sm"
            style={{ color: colors.muted }}
          >
            The AI could not extract any vocabulary words from the image. Try a
            clearer photo with more visible text.
          </AppText>
          <Button
            title="Back to Deck"
            variant="secondary"
            onPress={handleCancel}
            accessibilityLabel="Back to deck"
          />
        </View>
      </Screen>
    );
  }

  // All duplicates state
  if (status === "reviewing" && allDuplicates) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <AppText
            className="text-lg font-semibold"
            style={{ color: colors.text }}
            accessibilityRole="alert"
          >
            All words already exist
          </AppText>
          <AppText
            className="text-center text-sm"
            style={{ color: colors.muted }}
          >
            All extracted words already exist in your deck.
          </AppText>
          <Button
            title="Back to Deck"
            variant="secondary"
            onPress={handleCancel}
            accessibilityLabel="Back to deck"
          />
        </View>
      </Screen>
    );
  }

  // Insertion in progress state
  if (status === "inserting") {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText
            className="text-lg font-semibold"
            style={{ color: colors.text }}
            accessibilityLiveRegion="polite"
            accessibilityLabel={`Inserting ${insertionProgress.done} of ${insertionProgress.total} words`}
          >
            Inserting {insertionProgress.done} of {insertionProgress.total}...
          </AppText>
          <AppText className="text-sm" style={{ color: colors.muted }}>
            Please wait while your words are being added.
          </AppText>
        </View>
      </Screen>
    );
  }

  // Insertion failed with resume option
  if (
    insertionResult &&
    insertionResult.failed > 0 &&
    insertionResult.remainingWords.length > 0
  ) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <AppText
            className="text-lg font-semibold"
            style={{ color: colors.text }}
            accessibilityRole="alert"
          >
            Insertion stopped
          </AppText>
          <AppText
            className="text-center text-sm"
            style={{ color: colors.muted }}
          >
            Saved {insertionResult.inserted} of{" "}
            {insertionResult.inserted +
              insertionResult.skipped +
              insertionResult.failed +
              insertionResult.remainingWords.length}{" "}
            words. {insertionResult.remainingWords.length} words remaining.
            {insertionResult.skipped > 0 &&
              ` ${insertionResult.skipped} skipped as duplicates.`}
          </AppText>
          <View className="w-full flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Cancel"
                variant="secondary"
                onPress={handleCancel}
                accessibilityLabel="Cancel and return to deck"
              />
            </View>
            <View className="flex-1">
              <Button
                title="Resume"
                variant="primary"
                onPress={handleResume}
                accessibilityLabel={`Resume inserting ${insertionResult.remainingWords.length} remaining words`}
              />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  const renderItem = ({ item }: { item: ExtractedWord }) => {
    const isSelected = selectedIds.has(item.id);
    const isDuplicate = duplicateIds.has(item.id);
    const hasError =
      validationTriggered &&
      isSelected &&
      (item.word.trim().length === 0 || item.meaning.trim().length === 0);

    return (
      <ScanWordItem
        word={item}
        isSelected={isSelected}
        isDuplicate={isDuplicate}
        hasError={hasError}
        onToggle={() => handleToggle(item.id)}
        onRemove={() => handleRemove(item.id)}
        onUpdate={(updates) => handleUpdate(item.id, updates)}
      />
    );
  };

  return (
    <Screen>
      {/* Header */}
      <View className="gap-1 pb-4 pt-2">
        <AppText className="text-2xl font-bold" style={{ color: colors.text }}>
          Review Extracted Words
        </AppText>
        <AppText
          className="text-sm"
          style={{ color: colors.muted }}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${selectedCount} words selected`}
        >
          {selectedCount} selected
        </AppText>
      </View>

      {/* Duplicate detection unavailable warning */}
      {existingWordsError && (
        <View
          className="mb-3 rounded-xl px-4 py-2"
          style={{ backgroundColor: colors.primarySoft }}
          accessibilityRole="alert"
        >
          <AppText className="text-sm" style={{ color: colors.warning }}>
            Duplicate detection unavailable
          </AppText>
        </View>
      )}

      {/* Word list */}
      <FlatList
        ref={listRef}
        data={extractedWords}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 pb-4"
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <View className="flex-row gap-3 pb-4 pt-3">
        <View className="flex-1">
          <Button
            title="Cancel"
            variant="secondary"
            onPress={handleCancel}
            accessibilityLabel="Cancel and return to deck"
          />
        </View>
        <View className="flex-1">
          <Button
            title={`Add ${selectedCount} Words`}
            variant="primary"
            onPress={handleConfirm}
            disabled={selectedCount === 0}
            accessibilityLabel={
              selectedCount === 0
                ? "Add words, no words selected"
                : `Add ${selectedCount} words to deck`
            }
          />
        </View>
      </View>
    </Screen>
  );
}
