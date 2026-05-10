import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, TextInput, View } from "react-native";
import { AppText, useAppAlert } from "@/components/ui";
import { useAppTheme } from "@/lib/theme-provider";
import { useCreateDeckMutation, useUpdateDeckMutation } from "./deck-hooks";
import {
  DEFAULT_DECK_COLOR,
  DEFAULT_DECK_ICON,
  DeckIcon,
  deckIconKeys,
  normalizeDeckIconKey,
} from "./deck-icons";
import { deckFormSchema, type DeckFormValues } from "./deck-schema";
import type { Database } from "@/types/database";

type Deck = Database["public"]["Tables"]["decks"]["Row"];

export function DeckForm({
  deck,
  onSuccess,
}: {
  deck?: Deck;
  onSuccess?: () => void;
}) {
  const createDeck = useCreateDeckMutation();
  const updateDeck = useUpdateDeckMutation();
  const { colors } = useAppTheme();
  const appAlert = useAppAlert();
  const isEditing = Boolean(deck);
  const isSaving = createDeck.isPending || updateDeck.isPending;
  const form = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      name: deck?.name ?? "",
      description: deck?.description ?? "",
      icon: normalizeDeckIconKey(deck?.icon),
      color: deck?.color ?? DEFAULT_DECK_COLOR,
    },
  });

  useEffect(() => {
    form.reset({
      name: deck?.name ?? "",
      description: deck?.description ?? "",
      icon: normalizeDeckIconKey(deck?.icon),
      color: deck?.color ?? DEFAULT_DECK_COLOR,
    });
  }, [deck, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const input = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        icon: values.icon || DEFAULT_DECK_ICON,
        color: values.color || DEFAULT_DECK_COLOR,
      };
      if (deck) await updateDeck.mutateAsync({ deckId: deck.id, input });
      else await createDeck.mutateAsync(input);
      if (!deck) form.reset();
      onSuccess?.();
    } catch (error) {
      appAlert.show({
        title: isEditing ? "Update deck failed" : "Create deck failed",
        message: error instanceof Error ? error.message : "Please try again.",
        variant: "danger",
      });
    }
  });

  return (
    <View className="gap-6">
      <View className="gap-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <DeckTextField
              label="Deck Name"
              placeholder="e.g., Developer English"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <DeckTextField
              label="Description (Optional)"
              placeholder="What are you learning in this deck?"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              multiline
            />
          )}
        />
      </View>

      <Controller
        control={form.control}
        name="icon"
        render={({ field }) => (
          <View className="gap-4">
            <AppText className="px-1 text-xs font-medium leading-4" style={{ color: colors.muted }}>
              Select Icon
            </AppText>
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {deckIconKeys.map((iconKey) => {
                const isSelected = field.value === iconKey;
                return (
                  <Pressable
                    key={iconKey}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${iconKey} deck icon`}
                    accessibilityState={{ selected: isSelected }}
                    className={`items-center justify-center rounded-2xl ${isSelected ? "shadow-md" : ""}`}
                    style={{
                      width: 68.5,
                      height: 70,
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.primarySoft,
                    }}
                    onPress={() => field.onChange(iconKey)}
                  >
                    <DeckIcon
                      icon={iconKey}
                      color={isSelected ? "#ffffff" : colors.muted}
                      size={28}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />

      <Pressable
        accessibilityRole="button"
        className={`h-14 flex-row items-center justify-center rounded-xl ${isSaving ? "opacity-60" : ""}`}
        style={{ backgroundColor: colors.primary }}
        disabled={isSaving}
        onPress={onSubmit}
      >
        <CheckCircle color="#ffffff" size={22} strokeWidth={2.5} />
        <AppText className="ml-3 text-base leading-6 text-white">
          {isSaving ? "Saving..." : isEditing ? "Save Deck" : "Create Deck"}
        </AppText>
      </Pressable>
    </View>
  );
}

function DeckTextField({
  label,
  error,
  multiline,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="gap-2">
      <AppText className="px-1 text-xs font-medium leading-4" style={{ color: colors.muted }}>
        {label}
      </AppText>
      <TextInput
        className={`rounded-xl border px-4 text-base ${multiline ? "h-[78px] py-3" : "h-[53px]"}`}
        style={{ backgroundColor: colors.canvas, borderColor: colors.border, color: colors.text }}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
      {error ? (
        <AppText className="px-1 text-sm text-danger">{error}</AppText>
      ) : null}
    </View>
  );
}
