import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { AppText, Button, Card, FormInput, Screen } from '@/components/ui';
import { useReminderSettingsQuery, useUpdateReminderSettingsMutation } from '@/features/reminder/reminder-hooks';
import { cancelLexiLoopReminders, scheduleLexiLoopReminder } from '@/features/reminder/notification-service';
import { RepeatDaysSelector } from '@/features/reminder/repeat-days-selector';

export default function ReminderScreen() {
  const settings = useReminderSettingsQuery();
  const updateSettings = useUpdateReminderSettingsMutation();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('20:00');
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    if (!settings.data) return;
    setEnabled(settings.data.enabled);
    setTime(settings.data.time.slice(0, 5));
    setRepeatDays(settings.data.repeat_days);
  }, [settings.data]);

  const save = async () => {
    try {
      if (enabled) {
        const scheduled = await scheduleLexiLoopReminder({
          time,
          repeatDays,
          message: settings.data?.message ?? 'Time for your LexiLoop review.',
        });
        if (!scheduled) Alert.alert('Notifications disabled', 'Enable notifications in Settings to receive reminders.');
      } else {
        await cancelLexiLoopReminders();
      }
      await updateSettings.mutateAsync({ enabled, time, repeat_days: repeatDays });
      Alert.alert('Reminder saved', 'Your reminder settings have been updated.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-5 pb-8" showsVerticalScrollIndicator={false}>
        <AppText className="text-3xl font-bold">Daily Reminder</AppText>
        <Card className="flex-row items-center justify-between">
          <View className="flex-1">
            <AppText className="text-lg font-semibold">Enable reminder</AppText>
            <AppText className="text-muted">Get a gentle daily nudge.</AppText>
          </View>
          <Switch value={enabled} onValueChange={setEnabled} />
        </Card>
        <FormInput label="Time" value={time} onChangeText={setTime} placeholder="20:00" editable={enabled} />
        <RepeatDaysSelector value={repeatDays} onChange={setRepeatDays} />
        <Card><AppText className="font-semibold">Preview</AppText><AppText className="mt-1 text-muted">Time for your LexiLoop review.</AppText></Card>
        <Button title={updateSettings.isPending ? 'Saving...' : 'Save Reminder'} disabled={updateSettings.isPending} onPress={save} />
      </ScrollView>
    </Screen>
  );
}
