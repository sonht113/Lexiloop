import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

const REMINDER_NOTIFICATION_IDS_KEY = 'lexiloop_reminder_notification_ids';
const REMINDER_SYNC_STATUS_KEY = 'lexiloop_reminder_sync_status';
const REMINDER_CHANNEL_ID = 'lexiloop-reminders-v2';

export type ReminderSyncStatus = 'scheduled' | 'disabled' | 'unsupported' | 'permission-denied' | 'invalid-input' | 'failed';

export type ReminderSyncResult = {
  status: ReminderSyncStatus;
  message: string;
  scheduledCount?: number;
  nextTriggerDates?: string[];
};

function createReminderSyncResult(status: ReminderSyncStatus, message: string, scheduledCount?: number, nextTriggerDates?: string[]): ReminderSyncResult {
  return { status, message, scheduledCount, nextTriggerDates };
}

async function setLastReminderSyncResult(result: ReminderSyncResult) {
  await SecureStore.setItemAsync(REMINDER_SYNC_STATUS_KEY, JSON.stringify(result));
}

export async function getLastReminderSyncResult() {
  const value = await SecureStore.getItemAsync(REMINDER_SYNC_STATUS_KEY);
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.status !== 'string' || typeof parsed.message !== 'string') return null;
    return parsed as ReminderSyncResult;
  } catch {
    return null;
  }
}

function parseReminderTime(time: string) {
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function normalizeRepeatDays(repeatDays: number[]) {
  const days = [...new Set(repeatDays)].sort((left, right) => left - right);
  if (days.length === 0 || days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) return null;
  return days;
}

function formatScheduledMessage(scheduledCount: number, nextTriggerDates: string[]) {
  const nextTriggerDate = nextTriggerDates[0];
  if (!nextTriggerDate) return 'Reminder notifications are scheduled.';

  const formatted = new Date(nextTriggerDate).toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `Scheduled ${scheduledCount} reminder${scheduledCount === 1 ? '' : 's'}. Next reminder: ${formatted}.`;
}

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

async function getStoredReminderNotificationIds() {
  const value = await SecureStore.getItemAsync(REMINDER_NOTIFICATION_IDS_KEY);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function setStoredReminderNotificationIds(ids: string[]) {
  if (ids.length === 0) {
    await SecureStore.deleteItemAsync(REMINDER_NOTIFICATION_IDS_KEY);
    return;
  }

  await SecureStore.setItemAsync(REMINDER_NOTIFICATION_IDS_KEY, JSON.stringify(ids));
}

async function ensureReminderChannel(Notifications: NotificationsModule) {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'LexiLoop reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
  });
}

export async function requestReminderPermission() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function openExactAlarmSettings() {
  if (Platform.OS !== 'android') return false;

  try {
    await Linking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM');
    return true;
  } catch {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
}

export async function cancelLexiLoopReminders() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    await setStoredReminderNotificationIds([]);
    const result = createReminderSyncResult('disabled', 'Reminders are disabled.');
    await setLastReminderSyncResult(result);
    return result;
  }

  const ids = await getStoredReminderNotificationIds();
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  await setStoredReminderNotificationIds([]);
  const result = createReminderSyncResult('disabled', 'Reminders are disabled.');
  await setLastReminderSyncResult(result);
  return result;
}

export async function scheduleLexiLoopReminder(
  input: { time: string; repeatDays: number[]; message: string },
  options: { requestPermission?: boolean } = {},
) {
  try {
    const parsedTime = parseReminderTime(input.time);
    const repeatDays = normalizeRepeatDays(input.repeatDays);
    if (!parsedTime || !repeatDays) {
      const result = createReminderSyncResult('invalid-input', 'Reminder time or repeat days are invalid.');
      await setLastReminderSyncResult(result);
      return result;
    }

    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      const result = createReminderSyncResult('unsupported', 'Notifications are not supported in this environment.');
      await setLastReminderSyncResult(result);
      return result;
    }

    const current = await Notifications.getPermissionsAsync();
    const shouldRequestPermission = options.requestPermission ?? true;
    const granted = current.granted || (shouldRequestPermission && (await Notifications.requestPermissionsAsync()).granted);
    if (!granted) {
      const result = createReminderSyncResult('permission-denied', 'Enable notifications in Settings to receive reminders.');
      await setLastReminderSyncResult(result);
      return result;
    }

    await cancelLexiLoopReminders();
    await ensureReminderChannel(Notifications);

    const notificationIds: string[] = [];
    const nextTriggerDates: string[] = [];

    for (const weekday of repeatDays) {
      let trigger: import('expo-notifications').SchedulableNotificationTriggerInput;
      if (Platform.OS === 'android') {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: REMINDER_CHANNEL_ID,
          weekday: weekday === 0 ? 1 : weekday + 1,
          hour: parsedTime.hour,
          minute: parsedTime.minute,
        };
      } else {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          channelId: REMINDER_CHANNEL_ID,
          weekday: weekday === 0 ? 1 : weekday + 1,
          hour: parsedTime.hour,
          minute: parsedTime.minute,
          repeats: true,
        };
      }

      const nextTriggerDate = await Notifications.getNextTriggerDateAsync(trigger);
      if (nextTriggerDate) nextTriggerDates.push(new Date(nextTriggerDate).toISOString());

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'LexiLoop',
          body: input.message,
          sound: 'default',
          data: { source: 'lexiloop-reminder' },
        },
        trigger,
      });
      notificationIds.push(notificationId);
    }

    await setStoredReminderNotificationIds(notificationIds);
    nextTriggerDates.sort();
    const result = createReminderSyncResult(
      'scheduled',
      formatScheduledMessage(notificationIds.length, nextTriggerDates),
      notificationIds.length,
      nextTriggerDates,
    );
    await setLastReminderSyncResult(result);
    return result;
  } catch (error) {
    const result = createReminderSyncResult(
      'failed',
      error instanceof Error && error.message ? `Could not schedule reminders on this device. ${error.message}` : 'Could not schedule reminders on this device.',
    );
    await setLastReminderSyncResult(result);
    return result;
  }
}

export async function syncLexiLoopReminder(input: { enabled: boolean; time: string; repeatDays: number[]; message: string }) {
  if (!input.enabled) {
    return cancelLexiLoopReminders();
  }

  return scheduleLexiLoopReminder(
    {
      time: input.time,
      repeatDays: input.repeatDays,
      message: input.message,
    },
    { requestPermission: false },
  );
}
