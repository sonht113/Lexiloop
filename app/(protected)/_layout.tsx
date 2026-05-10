import { Redirect, Slot } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSessionQuery } from '@/features/auth/auth-hooks';
import { useUserBootstrapQuery } from '@/features/auth/user-bootstrap';
import { syncLexiLoopReminder } from '@/features/reminder/notification-service';
import { useReminderSettingsQuery } from '@/features/reminder/reminder-hooks';
import { useAppTheme } from '@/lib/theme-provider';

export default function ProtectedLayout() {
  const { data: session, isLoading } = useSessionQuery();
  const bootstrap = useUserBootstrapQuery(Boolean(session));
  const reminder = useReminderSettingsQuery(Boolean(session));
  const lastReminderSyncKey = useRef<string | null>(null);
  const { colors } = useAppTheme();

  useEffect(() => {
    if (!session || !reminder.data) return;

    const syncKey = `${reminder.data.enabled}:${reminder.data.time}:${reminder.data.repeat_days.join(',')}:${reminder.data.message}`;
    if (lastReminderSyncKey.current === syncKey) return;
    lastReminderSyncKey.current = syncKey;

    void syncLexiLoopReminder({
      enabled: reminder.data.enabled,
      time: reminder.data.time,
      repeatDays: reminder.data.repeat_days,
      message: reminder.data.message,
    });
  }, [reminder.data, session]);

  if (isLoading || (session && bootstrap.isLoading)) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return <Slot />;
}
