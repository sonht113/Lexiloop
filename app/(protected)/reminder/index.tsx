import { useRouter } from 'expo-router';
import { Check, ChevronLeft, GraduationCap } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { AppText, Screen, useAppAlert } from '@/components/ui';
import {
  cancelLexiLoopReminders,
  getLastReminderSyncResult,
  openExactAlarmSettings,
  scheduleLexiLoopReminder,
  type ReminderSyncResult,
} from '@/features/reminder/notification-service';
import { useReminderSettingsQuery, useUpdateReminderSettingsMutation } from '@/features/reminder/reminder-hooks';
import { useAppTheme } from '@/lib/theme-provider';

type Period = 'AM' | 'PM';
type TimePickerKind = 'hour' | 'minute';

const REMINDER_TITLE = 'Time to review your English words.';
const REMINDER_SUBTITLE = 'Keep your streak alive! 5 mins is all it takes.';
const REMINDER_MESSAGE = `${REMINDER_TITLE} ${REMINDER_SUBTITLE}`;

const repeatDays = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

function parseStoredTime(value: string) {
  const [hourText, minuteText] = value.slice(0, 5).split(':');
  const hour24 = Number(hourText);
  const minute = Number(minuteText);
  const period: Period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;

  return {
    hour: Number.isFinite(hour12) ? hour12 : 8,
    minute: Number.isFinite(minute) ? minute : 0,
    period,
  };
}

function toStoredTime(hour: number, minute: number, period: Period) {
  const hour24 = period === 'AM' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
  return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function TimeBox({
  label,
  value,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      disabled={disabled}
      className={`h-20 flex-1 items-center justify-center rounded-xl ${disabled ? 'opacity-50' : ''}`}
      style={{ backgroundColor: colors.primarySoft }}
      onPress={onPress}
    >
      <AppText className="text-[32px] font-bold leading-10" style={{ color: colors.primary }}>
        {value}
      </AppText>
    </Pressable>
  );
}

function TimePickerModal({
  kind,
  value,
  visible,
  onClose,
  onSelect,
}: {
  kind: TimePickerKind;
  value: number;
  visible: boolean;
  onClose: () => void;
  onSelect: (value: number) => void;
}) {
  const { colors } = useAppTheme();
  const values = useMemo(() => (kind === 'hour' ? Array.from({ length: 12 }, (_, index) => index + 1) : Array.from({ length: 60 }, (_, index) => index)), [kind]);
  const title = kind === 'hour' ? 'Select hour' : 'Select minute';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.36)' }}>
        <Pressable className="absolute inset-0" accessibilityRole="button" accessibilityLabel="Close time picker" onPress={onClose} />
        <View className="max-h-[70%] rounded-t-[24px] px-5 pb-6 pt-4" style={{ backgroundColor: colors.surface }}>
          <View className="items-center pb-3">
            <View className="h-1.5 w-12 rounded-full" style={{ backgroundColor: colors.border }} />
          </View>
          <View className="mb-4 flex-row items-center justify-between">
            <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
              {title}
            </AppText>
            <Pressable accessibilityRole="button" className="rounded-full px-4 py-2" style={{ backgroundColor: colors.primarySoft }} onPress={onClose}>
              <AppText className="text-sm font-semibold leading-5" style={{ color: colors.primary }}>
                Done
              </AppText>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="flex-row flex-wrap gap-3 pb-2">
            {values.map((item) => {
              const selected = item === value;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="h-11 w-[60px] items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: selected ? colors.primary : colors.canvas,
                    borderColor: selected ? colors.primary : colors.border,
                  }}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <AppText className="text-base font-semibold leading-6" style={{ color: selected ? '#ffffff' : colors.text }}>
                    {item.toString().padStart(2, '0')}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PeriodSelector({ value, disabled, onChange }: { value: Period; disabled: boolean; onChange: (value: Period) => void }) {
  const { colors } = useAppTheme();

  return (
    <View className={`w-16 overflow-hidden rounded-xl ${disabled ? 'opacity-50' : ''}`} style={{ backgroundColor: colors.primarySoft }}>
      {(['AM', 'PM'] as const).map((period) => {
        const selected = period === value;
        return (
          <Pressable
            key={period}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            disabled={disabled}
            className="h-10 items-center justify-center"
            style={{ backgroundColor: selected ? colors.primary : 'transparent' }}
            onPress={() => onChange(period)}
          >
            <AppText className="text-base font-semibold leading-6" style={{ color: selected ? '#ffffff' : colors.muted }}>
              {period}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ReminderScreen() {
  const router = useRouter();
  const settings = useReminderSettingsQuery();
  const updateSettings = useUpdateReminderSettingsMutation();
  const { colors } = useAppTheme();
  const appAlert = useAppAlert();
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<Period>('PM');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [lastSyncResult, setLastSyncResult] = useState<ReminderSyncResult | null>(null);
  const [activeTimePicker, setActiveTimePicker] = useState<TimePickerKind | null>(null);

  useEffect(() => {
    if (!settings.data) return;
    const parsedTime = parseStoredTime(settings.data.time);
    setEnabled(settings.data.enabled);
    setHour(parsedTime.hour);
    setMinute(parsedTime.minute);
    setPeriod(parsedTime.period);
    setSelectedDays(settings.data.repeat_days);
  }, [settings.data]);

  useEffect(() => {
    let isMounted = true;

    getLastReminderSyncResult().then((result) => {
      if (isMounted) setLastSyncResult(result);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const time = useMemo(() => toStoredTime(hour, minute, period), [hour, minute, period]);
  const isSaving = updateSettings.isPending;
  const controlsDisabled = !enabled || isSaving;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(protected)/(tabs)/profile');
  };

  const toggleDay = (day: number) => {
    setSelectedDays((current) => {
      const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort();
      return next.length ? next : current;
    });
  };

  const openReminderAccuracySettings = async () => {
    const opened = await openExactAlarmSettings();
    if (!opened) {
      appAlert.show({
        title: 'Could not open settings',
        message: 'Open Android Settings and allow Alarms & reminders for LexiLoop.',
        variant: 'warning',
      });
    }
  };

  const save = async () => {
    try {
      let syncResult: ReminderSyncResult | null = null;

      await updateSettings.mutateAsync({
        enabled,
        time,
        repeat_days: selectedDays,
        message: REMINDER_MESSAGE,
      });

      if (enabled) {
        const scheduled = await scheduleLexiLoopReminder({
          time,
          repeatDays: selectedDays,
          message: REMINDER_MESSAGE,
        });
        syncResult = scheduled;
        setLastSyncResult(scheduled);
      } else {
        const canceled = await cancelLexiLoopReminders();
        syncResult = canceled;
        setLastSyncResult(canceled);
      }

      if (enabled && syncResult?.status !== 'scheduled') {
        appAlert.show({
          title: syncResult?.status === 'exact-alarm-denied' ? 'Exact alarm required' : 'Notifications disabled',
          message: syncResult?.message ?? 'Reminder settings were saved, but notifications could not be scheduled.',
          variant: 'warning',
        });
        return;
      }

      appAlert.show({ title: 'Reminder saved', message: 'Your reminder settings have been updated.', variant: 'success' });
    } catch (error) {
      appAlert.show({ title: 'Save failed', message: error instanceof Error ? error.message : 'Please try again.', variant: 'danger' });
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
            <AppText className="text-[32px] font-bold leading-10" style={{ color: colors.text }}>
              Daily Reminder
            </AppText>
          </View>

          <View className="mt-8 rounded-xl border p-5 shadow-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between gap-4">
              <View className="min-w-0 flex-1">
                <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
                  Enable Reminders
                </AppText>
                <AppText className="mt-1 text-base leading-6" style={{ color: colors.muted }}>
                  Build your daily habit
                </AppText>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: enabled }}
                className="h-12 w-24 justify-center rounded-full px-1"
                style={{ backgroundColor: enabled ? colors.primary : colors.border }}
                onPress={() => setEnabled((value) => !value)}
              >
                <View
                  className="h-10 w-10 rounded-full bg-white shadow-sm"
                  style={{ transform: [{ translateX: enabled ? 46 : 0 }] }}
                />
              </Pressable>
            </View>
            {enabled && lastSyncResult && lastSyncResult.status !== 'scheduled' ? (
              <AppText className="mt-4 text-base leading-6" style={{ color: colors.warning }}>
                {lastSyncResult.message}
              </AppText>
            ) : null}
            {enabled && Platform.OS === 'android' ? (
              <View className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: colors.primarySoft }}>
                <AppText className="text-sm leading-5" style={{ color: colors.muted }}>
                  Allow Alarms & reminders so LexiLoop can notify exactly at your selected time.
                </AppText>
                <Pressable accessibilityRole="button" className="mt-2 self-start" onPress={openReminderAccuracySettings}>
                  <AppText className="text-sm font-semibold leading-5" style={{ color: colors.primary }}>
                    Open alarm settings
                  </AppText>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View className="mt-6">
            <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
              Time
            </AppText>
            <View className="mt-4 rounded-xl border p-5 shadow-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <View className="flex-row items-center gap-3">
                <TimeBox
                  label="Hour"
                  value={hour.toString().padStart(2, '0')}
                  disabled={controlsDisabled}
                  onPress={() => setActiveTimePicker('hour')}
                />
                <AppText className="text-[32px] font-bold leading-10" style={{ color: colors.muted }}>
                  :
                </AppText>
                <TimeBox
                  label="Minute"
                  value={minute.toString().padStart(2, '0')}
                  disabled={controlsDisabled}
                  onPress={() => setActiveTimePicker('minute')}
                />
                <PeriodSelector value={period} disabled={controlsDisabled} onChange={setPeriod} />
              </View>
            </View>
          </View>

          <View className="mt-6">
            <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
              Repeat
            </AppText>
            <View className="mt-4 rounded-xl border px-5 py-5 shadow-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <View className="flex-row justify-between">
                {repeatDays.map((day) => {
                  const selected = selectedDays.includes(day.value);
                  return (
                    <Pressable
                      key={`${day.label}-${day.value}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={controlsDisabled}
                      className={`h-10 w-10 items-center justify-center rounded-full ${controlsDisabled ? 'opacity-50' : ''}`}
                      style={{ backgroundColor: selected ? colors.primary : colors.border }}
                      onPress={() => toggleDay(day.value)}
                    >
                      <AppText className="text-base font-semibold leading-6" style={{ color: selected ? '#ffffff' : colors.muted }}>
                        {day.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="mt-6">
            <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>
              Preview
            </AppText>
            <View className="mt-4 rounded-xl border p-5 shadow-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <View className="flex-row items-start gap-4">
                <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.primary }}>
                  <GraduationCap color="#ffffff" size={20} strokeWidth={2.4} />
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center justify-between gap-4">
                    <AppText className="text-base font-semibold leading-6" style={{ color: colors.text }}>
                      LexiLoop
                    </AppText>
                    <AppText className="text-sm leading-5" style={{ color: colors.muted }}>
                      Now
                    </AppText>
                  </View>
                  <AppText className="mt-4 text-lg font-semibold leading-6" style={{ color: colors.text }}>
                    {REMINDER_TITLE}
                  </AppText>
                  <AppText className="mt-2 text-base leading-6" style={{ color: colors.muted }}>
                    {REMINDER_SUBTITLE}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="border-t px-5 py-4" style={{ backgroundColor: colors.canvas, borderColor: colors.border }}>
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            className={`min-h-12 flex-row items-center justify-center rounded-xl shadow-sm ${isSaving ? 'opacity-60' : ''}`}
            style={{ backgroundColor: colors.primary }}
            onPress={save}
          >
            <Check color="#ffffff" size={20} strokeWidth={3} />
            <AppText className="ml-2 text-base font-medium leading-6" style={{ color: '#ffffff' }}>
              {isSaving ? 'Saving...' : 'Save reminder'}
            </AppText>
          </Pressable>
        </View>
      </View>
      <TimePickerModal
        kind="hour"
        value={hour}
        visible={activeTimePicker === 'hour'}
        onClose={() => setActiveTimePicker(null)}
        onSelect={setHour}
      />
      <TimePickerModal
        kind="minute"
        value={minute}
        visible={activeTimePicker === 'minute'}
        onClose={() => setActiveTimePicker(null)}
        onSelect={setMinute}
      />
    </Screen>
  );
}
