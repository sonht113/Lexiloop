import * as Notifications from 'expo-notifications';

export async function requestReminderPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function cancelLexiLoopReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleLexiLoopReminder(input: { time: string; repeatDays: number[]; message: string }) {
  await cancelLexiLoopReminders();
  const granted = await requestReminderPermission();
  if (!granted) return false;

  const [hour, minute] = input.time.split(':').map(Number);

  for (const weekday of input.repeatDays) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'LexiLoop',
        body: input.message,
      },
      trigger: {
        weekday: weekday === 0 ? 1 : weekday + 1,
        hour,
        minute,
        repeats: true,
      },
    });
  }

  return true;
}
