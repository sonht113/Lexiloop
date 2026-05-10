import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSessionQuery } from '@/features/auth/auth-hooks';
import { useAppTheme } from '@/lib/theme-provider';

export default function GuestLayout() {
  const { data: session, isLoading } = useSessionQuery();
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (session) return <Redirect href="/(protected)/(tabs)/home" />;

  return <Slot />;
}
