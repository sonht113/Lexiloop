import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSessionQuery } from '@/features/auth/auth-hooks';
import { getOnboardingSeen } from '@/lib/onboarding-storage';
import { useAppTheme } from '@/lib/theme-provider';

export default function Index() {
  const { data: session, isLoading: isSessionLoading } = useSessionQuery();
  const { colors } = useAppTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    getOnboardingSeen()
      .then((value) => {
        if (isMounted) setHasSeenOnboarding(value);
      })
      .catch(() => {
        if (isMounted) setHasSeenOnboarding(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isSessionLoading || hasSeenOnboarding === null) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;

  if (session) return <Redirect href="/(protected)/(tabs)/home" />;

  return <Redirect href="/(auth)/sign-in" />;
}
