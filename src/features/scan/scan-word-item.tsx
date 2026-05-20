import { X } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, TextInput, View } from "react-native";

import { AppText } from "@/components/ui";
import { useAppTheme } from "@/lib/theme-provider";

import type { ExtractedWord } from "@/features/scan/scan-types";

type ScanWordItemProps = {
  word: ExtractedWord;
  isSelected: boolean;
  isDuplicate: boolean;
  hasError: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (
    updates: Partial<Pick<ExtractedWord, "word" | "meaning" | "examples">>,
  ) => void;
};

export function ScanWordItem({
  word,
  isSelected,
  isDuplicate,
  hasError,
  onToggle,
  onRemove,
  onUpdate,
}: ScanWordItemProps) {
  const { colors } = useAppTheme();

  const wordEmpty = word.word.trim().length === 0;
  const meaningEmpty = word.meaning.trim().length === 0;

  const handleWordChange = useCallback(
    (text: string) => {
      onUpdate({ word: text });
    },
    [onUpdate],
  );

  const handleMeaningChange = useCallback(
    (text: string) => {
      onUpdate({ meaning: text });
    },
    [onUpdate],
  );

  const handleExampleChange = useCallback(
    (index: number, text: string) => {
      const updatedExamples = [...word.examples];
      updatedExamples[index] = { ...updatedExamples[index], sentence: text };
      onUpdate({ examples: updatedExamples });
    },
    [onUpdate, word.examples],
  );

  return (
    <View
      className="gap-3 rounded-2xl border p-4"
      style={{
        borderColor: hasError ? colors.danger : colors.border,
        backgroundColor: isDuplicate ? colors.primarySoft : colors.surface,
      }}
    >
      {/* Top row: checkbox, duplicate badge, remove button */}
      <View className="flex-row items-center gap-3">
        {/* Checkbox */}
        <Pressable
          className="h-11 w-11 items-center justify-center"
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`Select ${word.word || "word"}${isDuplicate ? ", duplicate" : ""}`}
          hitSlop={4}
        >
          <View
            className="h-6 w-6 items-center justify-center rounded-md border-2"
            style={{
              borderColor: isSelected ? colors.primary : colors.muted,
              backgroundColor: isSelected ? colors.primary : "transparent",
            }}
          >
            {isSelected && (
              <AppText
                className="text-xs font-bold"
                style={{ color: "#FFFFFF" }}
              >
                ✓
              </AppText>
            )}
          </View>
        </Pressable>

        {/* Duplicate badge */}
        {isDuplicate && (
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: colors.warning }}
          >
            <AppText
              className="text-xs font-medium"
              style={{ color: "#000000" }}
            >
              Duplicate
            </AppText>
          </View>
        )}

        {/* Spacer */}
        <View className="flex-1" />

        {/* Remove button */}
        <Pressable
          className="h-11 w-11 items-center justify-center"
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${word.word || "word"}`}
          accessibilityHint="Permanently removes this word from the list"
          hitSlop={4}
        >
          <X color={colors.danger} size={20} />
        </Pressable>
      </View>

      {/* Word field */}
      <View className="gap-1">
        <AppText
          className="text-xs font-semibold"
          style={{ color: colors.muted }}
        >
          Word
        </AppText>
        <TextInput
          className="rounded-xl border px-3 py-2 text-base"
          style={{
            borderColor: hasError && wordEmpty ? colors.danger : colors.border,
            backgroundColor: colors.background,
            color: colors.text,
          }}
          value={word.word}
          onChangeText={handleWordChange}
          maxLength={80}
          placeholder="Enter word"
          placeholderTextColor={colors.muted}
          accessibilityLabel={`Word field for ${word.word || "new word"}`}
        />
        {hasError && wordEmpty && (
          <AppText className="text-xs" style={{ color: colors.danger }}>
            Word is required
          </AppText>
        )}
      </View>

      {/* Meaning field */}
      <View className="gap-1">
        <AppText
          className="text-xs font-semibold"
          style={{ color: colors.muted }}
        >
          Meaning
        </AppText>
        <TextInput
          className="rounded-xl border px-3 py-2 text-base"
          style={{
            borderColor:
              hasError && meaningEmpty ? colors.danger : colors.border,
            backgroundColor: colors.background,
            color: colors.text,
            minHeight: 60,
            textAlignVertical: "top",
          }}
          value={word.meaning}
          onChangeText={handleMeaningChange}
          maxLength={500}
          multiline
          placeholder="Enter meaning"
          placeholderTextColor={colors.muted}
          accessibilityLabel={`Meaning field for ${word.word || "new word"}`}
        />
        {hasError && meaningEmpty && (
          <AppText className="text-xs" style={{ color: colors.danger }}>
            Meaning is required
          </AppText>
        )}
      </View>

      {/* Examples section */}
      {word.examples.length > 0 && (
        <View className="gap-2">
          <AppText
            className="text-xs font-semibold"
            style={{ color: colors.muted }}
          >
            Examples
          </AppText>
          {word.examples.slice(0, 3).map((example, index) => (
            <TextInput
              key={index}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text,
              }}
              value={example.sentence}
              onChangeText={(text) => handleExampleChange(index, text)}
              maxLength={500}
              multiline
              placeholder={`Example ${index + 1}`}
              placeholderTextColor={colors.muted}
              accessibilityLabel={`Example ${index + 1} for ${word.word || "word"}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
