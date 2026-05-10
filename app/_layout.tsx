import '../src/styles/global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppAlertProvider } from '@/components/ui';
import { QueryProvider } from '@/lib/query-provider';
import { RealtimeProvider } from '@/lib/realtime-provider';
import { ThemeProvider } from '@/lib/theme-provider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppAlertProvider>
          <QueryProvider>
            <BottomSheetModalProvider>
              <RealtimeProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(protected)" />
                </Stack>
              </RealtimeProvider>
            </BottomSheetModalProvider>
          </QueryProvider>
        </AppAlertProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
