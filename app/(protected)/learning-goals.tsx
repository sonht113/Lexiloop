import { useRouter } from 'expo-router';
import { BookOpen, Check, ChevronLeft, Minus, Plus, RotateCcw, Target } from 'lucide-react-native';
import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View, type ColorValue } from 'react-native';
import { AppText, Screen, useAppAlert } from '@/components/ui';
import {
  DEFAULT_LEARNING_SETTINGS,
  LEARNING_SETTINGS_LIMITS,
  type LearningSettingsInput,
  useLearningSettingsQuery,
  useUpdateLearningSettingsMutation,
} from '@/features/learning-settings/learning-settings-hooks';
import { useAppTheme } from '@/lib/theme-provider';

type GoalKey = keyof LearningSettingsInput;

type GoalFieldConfig = {
  key: GoalKey;
  title: string;
  subtitle: string;
  icon: ComponentType<{ color?: ColorValue; size?: number; strokeWidth?: number }>;
  tone: 'primary' | 'success' | 'warning';
};

const goalFields: GoalFieldConfig[] = [
  {
    key: 'daily_new_words_limit',
    title: 'New Words',
    subtitle: 'Fresh words introduced each day.',
    icon: BookOpen,
    tone: 'success',
  },
  {
    key: 'daily_weak_words_limit',
    title: 'Weak Review',
    subtitle: 'Weak words included in daily reinforcement.',
    icon: RotateCcw,
    tone: 'warning',
  },
  {
    key: 'daily_review_target',
    title: 'Review Target',
    subtitle: 'Daily review target for plan progress.',
    icon: Target,
    tone: 'primary',
  },
];

function getToneColor(tone: GoalFieldConfig['tone'], colors: ReturnType<typeof useAppTheme>['colors']) {
  if (tone === 'success') return colors.success;
  if (tone === 'warning') return colors.warning;
  return colors.primary;
}

function clampGoal(key: GoalKey, value: number) {
  const limits = LEARNING_SETTINGS_LIMITS[key];
  return Math.min(limits.max, Math.max(limits.min, value));
}

function parseGoalValue(key: GoalKey, value: string) {
  const limits = LEARNING_SETTINGS_LIMITS[key];
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    throw new Error('Daily goals must be whole numbers.');
  }
  if (parsed < limits.min || parsed > limits.max) {
    throw new Error(`Value must be between ${limits.min} and ${limits.max}.`);
  }
  return parsed;
}

function GoalControl({
  field,
  value,
  disabled,
  onChange,
}: {
  field: GoalFieldConfig;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const { colors } = useAppTheme();
  const toneColor = getToneColor(field.tone, colors);
  const limits = LEARNING_SETTINGS_LIMITS[field.key];
  const numericValue = Number.parseInt(value || `${DEFAULT_LEARNING_SETTINGS[field.key]}`, 10);
  const Icon = field.icon;

  const step = (delta: number) => {
    const nextValue = clampGoal(field.key, (Number.isFinite(numericValue) ? numericValue : DEFAULT_LEARNING_SETTINGS[field.key]) + delta);
    onChange(String(nextValue));
  };

  return (
    <View className="rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="flex-row items-start gap-4">
        <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${toneColor}1a` }}>
          <Icon color={toneColor} size={22} strokeWidth={2.4} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
            {field.title}
          </AppText>
          <AppText className="mt-1 text-sm leading-5" style={{ color: colors.muted }}>
            {field.subtitle}
          </AppText>
          <AppText className="mt-1 text-xs leading-4" style={{ color: colors.muted }}>
            Range {limits.min}-{limits.max}
          </AppText>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${field.title}`}
          disabled={disabled}
          className={`h-12 w-12 items-center justify-center rounded-xl ${disabled ? 'opacity-60' : ''}`}
          style={{ backgroundColor: colors.primarySoft }}
          onPress={() => step(-1)}
        >
          <Minus color={colors.primary} size={20} strokeWidth={2.6} />
        </Pressable>
        <TextInput
          accessibilityLabel={field.title}
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={3}
          className={`h-12 flex-1 rounded-xl border px-4 text-center text-lg font-semibold ${disabled ? 'opacity-60' : ''}`}
          style={{ backgroundColor: colors.canvas, borderColor: colors.border, color: colors.text }}
          placeholder={`${DEFAULT_LEARNING_SETTINGS[field.key]}`}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${field.title}`}
          disabled={disabled}
          className={`h-12 w-12 items-center justify-center rounded-xl ${disabled ? 'opacity-60' : ''}`}
          style={{ backgroundColor: colors.primarySoft }}
          onPress={() => step(1)}
        >
          <Plus color={colors.primary} size={20} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

export default function LearningGoalsScreen() {
  const router = useRouter();
  const settings = useLearningSettingsQuery();
  const updateSettings = useUpdateLearningSettingsMutation();
  const { colors } = useAppTheme();
  const appAlert = useAppAlert();
  const [values, setValues] = useState<Record<GoalKey, string>>({
    daily_new_words_limit: String(DEFAULT_LEARNING_SETTINGS.daily_new_words_limit),
    daily_weak_words_limit: String(DEFAULT_LEARNING_SETTINGS.daily_weak_words_limit),
    daily_review_target: String(DEFAULT_LEARNING_SETTINGS.daily_review_target),
  });

  useEffect(() => {
    if (!settings.data) return;
    setValues({
      daily_new_words_limit: String(settings.data.daily_new_words_limit),
      daily_weak_words_limit: String(settings.data.daily_weak_words_limit),
      daily_review_target: String(settings.data.daily_review_target),
    });
  }, [settings.data]);

  const summary = useMemo(
    () => `${values.daily_new_words_limit || '-'} new / ${values.daily_weak_words_limit || '-'} weak / ${values.daily_review_target || '-'} reviews`,
    [values],
  );
  const isSaving = updateSettings.isPending;
  const disabled = settings.isLoading || isSaving;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(protected)/(tabs)/profile');
  };

  const save = async () => {
    try {
      const input: LearningSettingsInput = {
        daily_new_words_limit: parseGoalValue('daily_new_words_limit', values.daily_new_words_limit),
        daily_weak_words_limit: parseGoalValue('daily_weak_words_limit', values.daily_weak_words_limit),
        daily_review_target: parseGoalValue('daily_review_target', values.daily_review_target),
      };

      await updateSettings.mutateAsync(input);
      appAlert.show({ title: 'Daily goals saved', message: 'Your learning pace has been updated.', variant: 'success' });
    } catch (error) {
      appAlert.show({ title: 'Save failed', message: error instanceof Error ? error.message : 'Please check your daily goals.', variant: 'danger' });
    }
  };

  return (
    <Screen className="px-0" style={{ backgroundColor: colors.canvas }}>
      <View className="flex-1">
        <ScrollView contentContainerClassName="px-5 pb-8 pt-6" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="h-10 w-10 items-center justify-center rounded-full shadow-sm"
              style={{ backgroundColor: colors.surface }}
              onPress={goBack}
            >
              <ChevronLeft color={colors.muted} size={20} strokeWidth={2.6} />
            </Pressable>
            <View className="min-w-0 flex-1">
              <AppText className="text-[32px] font-bold leading-10" style={{ color: colors.text }}>
                Daily Goals
              </AppText>
              <AppText className="mt-1 text-base leading-6" style={{ color: colors.muted }}>
                {settings.isLoading ? 'Loading your pace...' : summary}
              </AppText>
            </View>
          </View>

          {settings.isError ? (
            <View className="mt-6 rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <AppText className="text-base font-semibold leading-6" style={{ color: colors.danger }}>
                Could not load daily goals
              </AppText>
              <AppText className="mt-1 text-sm leading-5" style={{ color: colors.muted }}>
                Please try again later.
              </AppText>
            </View>
          ) : null}

          <View className="mt-8 gap-4">
            {goalFields.map((field) => (
              <GoalControl
                key={field.key}
                field={field}
                value={values[field.key]}
                disabled={disabled}
                onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))}
              />
            ))}
          </View>
        </ScrollView>

        <View className="border-t px-5 py-4" style={{ backgroundColor: colors.canvas, borderColor: colors.border }}>
          <Pressable
            accessibilityRole="button"
            disabled={disabled || settings.isError}
            className={`min-h-12 flex-row items-center justify-center rounded-xl shadow-sm ${disabled || settings.isError ? 'opacity-60' : ''}`}
            style={{ backgroundColor: colors.primary }}
            onPress={save}
          >
            {isSaving ? <ActivityIndicator color="#ffffff" size="small" /> : <Check color="#ffffff" size={20} strokeWidth={3} />}
            <AppText className="ml-2 text-base font-medium leading-6" style={{ color: '#ffffff' }}>
              {isSaving ? 'Saving...' : 'Save daily goals'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
