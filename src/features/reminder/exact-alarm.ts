import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type LexiloopExactAlarmModule = {
  canScheduleExactAlarmsAsync?: () => Promise<boolean>;
};

const LexiloopExactAlarm = requireOptionalNativeModule<LexiloopExactAlarmModule>('LexiloopExactAlarm');

export type ExactReminderAccess = 'granted' | 'denied' | 'unavailable';

export async function getExactReminderAccess(): Promise<ExactReminderAccess> {
  if (Platform.OS !== 'android') return 'granted';
  if (!LexiloopExactAlarm?.canScheduleExactAlarmsAsync) return 'unavailable';

  try {
    return (await LexiloopExactAlarm.canScheduleExactAlarmsAsync()) ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function canScheduleExactReminders() {
  return (await getExactReminderAccess()) === 'granted';
}
