import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSessionQuery } from '@/features/auth/auth-hooks';

export default function ProtectedLayout() {
  const { data: session, isLoading } = useSessionQuery();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#4F46E5" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return <Slot />;
}
