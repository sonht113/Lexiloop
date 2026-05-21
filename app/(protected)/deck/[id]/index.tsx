import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  MoreVertical,
  Play,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { AppText, EmptyState, Screen } from "@/components/ui";
import { useDeckQuery, useDecksQuery } from "@/features/decks/deck-hooks";
import {
  DEFAULT_LEARNING_SETTINGS,
  useLearningSettingsQuery,
} from "@/features/learning-settings/learning-settings-hooks";
import {
  useDueWordsQuery,
  useWeakWordsQuery,
} from "@/features/review/review-hooks";
import { compressImage } from "@/features/scan/image-compressor";
import { ScanButton } from "@/features/scan/scan-button";
import { ScanErrorOverlay } from "@/features/scan/scan-error-overlay";
import { useScanMutation } from "@/features/scan/scan-hooks";
import { useScanStore } from "@/features/scan/scan-store";
import {
  getWordStatus,
  isLearningWordStatus,
  WordCard,
} from "@/features/words/word-card";
import { fetchDictionaryPronunciation } from "@/features/words/dictionary-api";
import { WordForm } from "@/features/words/word-form";
import { useWordsQuery } from "@/features/words/word-hooks";
import { useAppTheme } from "@/lib/theme-provider";

const filters = ["All", "Due", "Learning", "Mastered"] as const;
type Filter = (typeof filters)[number];

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `scan-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 9)}`;
}

function isWordDue(word: { due_at: string }) {
  return new Date(word.due_at).getTime() <= Date.now();
}

function StatBlock({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "primary" | "warning" | "success";
}) {
  const { colors } = useAppTheme();
  const toneColor = {
    primary: colors.primary,
    warning: colors.warning,
    success: colors.success,
  }[tone];

  return (
    <View
      className="min-h-[84px] flex-1 items-center justify-center rounded-lg px-3 py-3"
      style={{ backgroundColor: colors.primarySoft }}
    >
      <AppText
        className="text-lg font-semibold leading-6"
        style={{ color: toneColor }}
      >
        {value}
      </AppText>
      <AppText
        className="mt-1 text-center text-xs font-medium leading-4"
        style={{ color: colors.muted }}
      >
        {label}
      </AppText>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: Filter;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-[34px] items-center justify-center rounded-full border px-4"
      style={{
        backgroundColor: active ? colors.primary : colors.surface,
        borderColor: active ? colors.primary : colors.border,
      }}
      onPress={onPress}
    >
      <AppText
        className="text-xs font-medium leading-4"
        style={{ color: active ? "#ffffff" : colors.muted }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export default function DeckDetailScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const deck = useDeckQuery(id);
  const decks = useDecksQuery();
  const words = useWordsQuery(id);
  const dueWords = useDueWordsQuery(id);
  const learningSettings = useLearningSettingsQuery();
  const dailyWeakWordsLimit =
    learningSettings.data?.daily_weak_words_limit ??
    DEFAULT_LEARNING_SETTINGS.daily_weak_words_limit;
  const weakWords = useWeakWordsQuery(id, dailyWeakWordsLimit);
  const [showAddWord, setShowAddWord] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const scanMutation = useScanMutation();
  const scanStore = useScanStore();
  const queryClient = useQueryClient();

  const existingWords = useMemo(
    () => (words.data ?? []).map((w) => w.word),
    [words.data],
  );

  const handleImageSelected = useCallback(
    async (uri: string) => {
      try {
        scanStore.setDeckId(id);
        scanStore.setStatus("compressing");

        const compressed = await compressImage(uri);
        scanStore.setCompressedImage(compressed.base64);
        scanStore.setStatus("scanning");

        const response = await scanMutation.mutateAsync({
          image_base64: compressed.base64,
          deck_id: id,
        });

        // Optimistically update quota cache from response (Requirement 10.4)
        queryClient.setQueryData(["scan-quota"], {
          remaining_scans: response.remaining_scans,
          reset_time: response.reset_time,
        });

        // Assign unique IDs to words from the AI response
        const wordsWithIds = response.words.map((w) => ({
          ...w,
          id: generateId(),
        }));

        // Fetch dictionary pronunciation data for each word
        scanStore.setStatus("enriching");
        const results = await Promise.allSettled(
          wordsWithIds.map(async (w) => {
            const pron = await fetchDictionaryPronunciation(w.word);
            return { ...w, phonetic: pron.phonetic, audioUrl: pron.audioUrl };
          }),
        );
        const wordsWithPronunciation = results.map((result, i) =>
          result.status === "fulfilled"
            ? result.value
            : { ...wordsWithIds[i], phonetic: null, audioUrl: null },
        );

        scanStore.setExtractedWords(wordsWithPronunciation, existingWords);
        scanStore.setStatus("reviewing");
        router.push("/scan/review" as any);
      } catch (error) {
        console.error("[Scan] Error in handleImageSelected:", error);
        if (error && typeof error === "object" && "code" in error) {
          const scanError = error as {
            code: string;
            message?: string;
            retryable?: boolean;
            resetTime?: string;
          };
          scanStore.setError({
            code: (scanError.code as any) || "UNKNOWN",
            message: scanError.message || "An error occurred",
            retryable: scanError.retryable ?? false,
            resetTime: scanError.resetTime,
          });
        } else {
          scanStore.setError({
            code: "UNKNOWN",
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
            retryable: false,
          });
        }
        scanStore.setStatus("idle");
      }
    },
    [id, existingWords, scanMutation, scanStore, router, queryClient],
  );

  const handleRetry = useCallback(async () => {
    const { compressedImage } = useScanStore.getState();
    if (!compressedImage) return;

    scanStore.setError(null);
    scanStore.setStatus("scanning");

    try {
      const response = await scanMutation.mutateAsync({
        image_base64: compressedImage,
        deck_id: id,
      });

      // Assign unique IDs to words from the AI response
      const wordsWithIds = response.words.map((w) => ({
        ...w,
        id: generateId(),
      }));

      // Fetch dictionary pronunciation data for each word
      scanStore.setStatus("enriching");
      const results = await Promise.allSettled(
        wordsWithIds.map(async (w) => {
          const pron = await fetchDictionaryPronunciation(w.word);
          return { ...w, phonetic: pron.phonetic, audioUrl: pron.audioUrl };
        }),
      );
      const wordsWithPronunciation = results.map((result, i) =>
        result.status === "fulfilled"
          ? result.value
          : { ...wordsWithIds[i], phonetic: null, audioUrl: null },
      );

      scanStore.setExtractedWords(wordsWithPronunciation, existingWords);
      scanStore.setStatus("reviewing");
      router.push("/scan/review" as any);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const scanError = error as {
          code: string;
          message?: string;
          retryable?: boolean;
          resetTime?: string;
        };
        scanStore.setError({
          code: (scanError.code as any) || "UNKNOWN",
          message: scanError.message || "An error occurred",
          retryable: scanError.retryable ?? false,
          resetTime: scanError.resetTime,
        });
      } else {
        scanStore.setError({
          code: "UNKNOWN",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          retryable: false,
        });
      }
      scanStore.setStatus("idle");
    }
  }, [id, existingWords, scanMutation, scanStore, router]);

  const handleDismiss = useCallback(() => {
    scanStore.setError(null);
    scanStore.reset();
  }, [scanStore]);

  const filteredWords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (words.data ?? []).filter((word) => {
      const status = getWordStatus(word);
      const matchesFilter =
        filter === "All" ||
        (filter === "Due" && isWordDue(word)) ||
        (filter === "Learning" && isLearningWordStatus(status)) ||
        (filter === "Mastered" && status === "Mastered");
      const matchesSearch =
        !keyword ||
        word.word.toLowerCase().includes(keyword) ||
        word.meaning.toLowerCase().includes(keyword);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, words.data]);

  const deckStats = decks.data?.find((item) => item.id === id);
  const totalWords = deckStats?.word_count ?? words.data?.length ?? 0;
  const dueCount = deckStats?.due_count ?? dueWords.data?.length ?? 0;
  const weakCount = weakWords.data?.length ?? 0;
  const masteredCount =
    deckStats?.mastered_count ??
    words.data?.filter((word) => getWordStatus(word) === "Mastered").length ??
    0;
  const deckName = deck.data?.name ?? deckStats?.name ?? "Deck";

  return (
    <Screen className="px-0" style={{ backgroundColor: colors.canvas }}>
      <View
        className="h-16 flex-row items-center px-5"
        style={{ backgroundColor: colors.elevated }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to decks"
          className="h-8 w-8 items-center justify-center rounded-full"
          onPress={() => router.replace("/(protected)/(tabs)/decks")}
        >
          <ArrowLeft color={colors.text} size={18} />
        </Pressable>
        <AppText
          className="flex-1 px-4 text-center text-2xl font-bold leading-8"
          numberOfLines={1}
          style={{ color: colors.primary }}
        >
          {deckName}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Deck options"
          className="h-8 w-8 items-center justify-center rounded-full"
        >
          <MoreVertical color={colors.text} size={18} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="rounded-xl border p-6"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row gap-4">
            <StatBlock value={totalWords} label="Total Words" tone="primary" />
            <StatBlock value={dueCount} label="Due Today" tone="warning" />
            <StatBlock value={masteredCount} label="Mastered" tone="success" />
          </View>

          <View className="mt-6 gap-4">
            <Link
              href={`/(protected)/review/session?deckId=${id}&mode=due`}
              asChild
            >
              <Pressable
                accessibilityRole="button"
                className={`min-h-12 flex-row items-center justify-center gap-2 rounded-lg ${dueCount === 0 ? "opacity-50" : ""}`}
                style={{ backgroundColor: colors.primary }}
                disabled={dueCount === 0}
              >
                <Play color="#ffffff" fill="#ffffff" size={14} />
                <AppText
                  className="text-base font-medium leading-6"
                  style={{ color: "#ffffff" }}
                >
                  {dueCount > 0 ? `Review Due (${dueCount})` : "No words due"}
                </AppText>
              </Pressable>
            </Link>
            <Link
              href={`/(protected)/review/session?deckId=${id}&mode=practice`}
              asChild
            >
              <Pressable
                accessibilityRole="button"
                className={`min-h-12 flex-row items-center justify-center gap-2 rounded-lg ${totalWords === 0 ? "opacity-50" : ""}`}
                style={{ backgroundColor: colors.primarySoft }}
                disabled={totalWords === 0}
              >
                <RotateCcw color={colors.primary} size={15} />
                <AppText
                  className="text-base font-medium leading-6"
                  style={{ color: colors.primary }}
                >
                  {totalWords > 0
                    ? `Practice All (${totalWords})`
                    : "No words to practice"}
                </AppText>
              </Pressable>
            </Link>
            <Link
              href={`/(protected)/review/session?deckId=${id}&mode=weak`}
              asChild
            >
              <Pressable
                accessibilityRole="button"
                className={`min-h-12 flex-row items-center justify-center gap-2 rounded-lg ${weakCount === 0 ? "opacity-50" : ""}`}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
                disabled={weakCount === 0}
              >
                <RotateCcw color={colors.warning} size={15} />
                <AppText
                  className="text-base font-medium leading-6"
                  style={{ color: colors.warning }}
                >
                  {weakCount > 0
                    ? `Weak Review (${weakCount})`
                    : "No weak words to practice"}
                </AppText>
              </Pressable>
            </Link>
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-lg"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              onPress={() => setShowAddWord((value) => !value)}
            >
              <Plus color={colors.primary} size={14} />
              <AppText
                className="text-base font-medium leading-6"
                style={{ color: colors.primary }}
              >
                {showAddWord ? "Cancel" : "Add Word"}
              </AppText>
            </Pressable>
          </View>
        </View>

        {showAddWord ? (
          <WordForm
            defaultDeckId={id}
            onSuccess={(mode) => mode === "done" && setShowAddWord(false)}
          />
        ) : null}

        <View className="gap-4">
          <View
            className="min-h-[45px] justify-center rounded-lg border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <View className="absolute left-3 z-10">
              <Search color={colors.muted} size={18} />
            </View>
            <TextInput
              className="min-h-[45px] rounded-lg px-10 text-base"
              style={{ color: colors.text }}
              placeholder="Search words..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView
            horizontal
            contentContainerClassName="gap-2 pr-5"
            showsHorizontalScrollIndicator={false}
          >
            {filters.map((item) => (
              <FilterChip
                key={item}
                label={item}
                active={filter === item}
                onPress={() => setFilter(item)}
              />
            ))}
          </ScrollView>
        </View>

        <View className="gap-4">
          {words.isLoading || deck.isLoading ? (
            <AppText style={{ color: colors.muted }}>Loading words...</AppText>
          ) : null}
          {words.isError || deck.isError ? (
            <EmptyState
              title="Could not load deck"
              description="Please try again later."
            />
          ) : null}
          {words.data?.length === 0 ? (
            <EmptyState
              title="No words yet"
              description="Add your first word to start reviewing."
            />
          ) : null}
          {words.data?.length
            ? filteredWords.map((word) => (
                <WordCard key={word.id} word={word} />
              ))
            : null}
          {words.data?.length && filteredWords.length === 0 ? (
            <EmptyState
              title="No matching words"
              description="Try another search or filter."
            />
          ) : null}
          {filteredWords.length > 0 ? (
            <AppText
              className="pt-2 text-center text-base leading-6"
              style={{ color: colors.muted }}
            >
              End of list
            </AppText>
          ) : null}
        </View>
      </ScrollView>

      {(scanStore.status === "compressing" ||
        scanStore.status === "scanning" ||
        scanStore.status === "enriching") && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className="items-center gap-3 rounded-2xl p-8"
            style={{ backgroundColor: colors.surface }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText
              className="text-base font-medium"
              style={{ color: colors.text }}
            >
              {scanStore.status === "compressing"
                ? "Compressing image..."
                : scanStore.status === "scanning"
                  ? "Analyzing vocabulary..."
                  : "Fetching pronunciation..."}
            </AppText>
          </View>
        </View>
      )}

      <ScanButton
        deckId={id}
        onImageSelected={handleImageSelected}
        disabled={scanStore.status !== "idle"}
      />

      <ScanErrorOverlay onRetry={handleRetry} onDismiss={handleDismiss} />
    </Screen>
  );
}
