import Constants from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    return null;
  }

  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export async function requestReminderPermission() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function cancelLexiLoopReminders() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleLexiLoopReminder(input: { time: string; repeatDays: number[]; message: string }) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  await Notifications.cancelAllScheduledNotificationsAsync();
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;

  const [hour, minute] = input.time.split(':').map(Number);

  for (const weekday of input.repeatDays) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'LexiLoop',
        body: input.message,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: weekday === 0 ? 1 : weekday + 1,
        hour,
        minute,
        repeats: true,
      },
    });
  }

  return true;
}
