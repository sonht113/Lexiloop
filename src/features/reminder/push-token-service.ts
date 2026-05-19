import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

type NotificationsModule = typeof import('expo-notifications');

export type ReminderPushTokenResult = {
  status: 'registered' | 'permission-denied' | 'unsupported' | 'failed';
  message: string;
  token?: string;
};

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

function getProjectId() {
  return Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
}

export async function registerReminderPushToken(options: { requestPermission?: boolean } = {}): Promise<ReminderPushTokenResult> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return { status: 'unsupported', message: 'Push notifications are not supported in this environment.' };
    }

    const current = await Notifications.getPermissionsAsync();
    const shouldRequestPermission = options.requestPermission ?? false;
    const granted = current.granted || (shouldRequestPermission && (await Notifications.requestPermissionsAsync()).granted);
    if (!granted) {
      return { status: 'permission-denied', message: 'Enable notifications in Settings to receive server reminders.' };
    }

    const projectId = getProjectId();
    if (!projectId) {
      return { status: 'unsupported', message: 'Missing EAS project ID for Expo push notifications.' };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) {
      return { status: 'unsupported', message: 'Sign in to register reminder push notifications.' };
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.from('reminder_push_tokens').upsert(
      {
        user_id: userData.user.id,
        token: pushToken.data,
        platform: Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web' ? Platform.OS : 'unknown',
        enabled: true,
        last_registered_at: new Date().toISOString(),
        last_error: null,
      },
      { onConflict: 'user_id,token' },
    );
    if (error) throw error;

    return { status: 'registered', message: 'Server reminder push token registered.', token: pushToken.data };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error && error.message ? `Could not register push token. ${error.message}` : 'Could not register push token.',
    };
  }
}

export async function disableReminderPushTokens() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return;

    await supabase
      .from('reminder_push_tokens')
      .update({ enabled: false, last_error: null })
      .eq('user_id', userData.user.id);
  } catch {
    // Sign-out should not be blocked by best-effort token cleanup.
  }
}
