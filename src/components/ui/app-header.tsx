import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { Modal, Pressable, View, type ColorValue } from 'react-native';
import { useRouter, useSegments, type Href } from 'expo-router';
import { Bell, BookOpen, Layers, Menu, Plus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStatsQuery } from '@/features/profile/profile-hooks';
import { useAppTheme } from '@/lib/theme-provider';
import { AppText } from './app-text';

type HeaderAction = {
  label: string;
  description: string;
  href: Href;
  icon: ComponentType<{ color?: ColorValue; size?: number; strokeWidth?: number }>;
};

export function AppHeader() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const profile = useProfileStatsQuery();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const currentTab = segments[2];
  const isProfileTab = currentTab === 'profile';
  const initial = profile.data?.profile.username?.slice(0, 1).toUpperCase() ?? 'L';

  const actions = useMemo<HeaderAction[]>(() => {
    const quickAdd: HeaderAction = {
      label: 'Quick Add',
      description: 'Add a word to your deck',
      href: '/(protected)/word/quick-add',
      icon: Plus,
    };
    const review: HeaderAction = {
      label: 'Review',
      description: 'Open today review',
      href: '/(protected)/(tabs)/review',
      icon: BookOpen,
    };
    const decks: HeaderAction = {
      label: 'Decks',
      description: 'Manage your word decks',
      href: '/(protected)/(tabs)/decks',
      icon: Layers,
    };
    const reminder: HeaderAction = {
      label: 'Reminder',
      description: 'Adjust daily reminder',
      href: '/(protected)/reminder',
      icon: Bell,
    };

    if (currentTab === 'profile') return [reminder, quickAdd, review];
    if (currentTab === 'decks') return [quickAdd, review, reminder];
    if (currentTab === 'review') return [review, quickAdd, reminder];
    return [quickAdd, review, decks, reminder];
  }, [currentTab]);

  const openProfile = () => {
    if (!isProfileTab) router.push('/(protected)/(tabs)/profile');
  };

  const openAction = (href: Href) => {
    setIsMenuVisible(false);
    router.push(href);
  };

  return (
    <View style={{ backgroundColor: colors.elevated, paddingTop: insets.top }}>
      <View className="relative h-16 flex-row items-center justify-between px-5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open quick actions"
          className="h-7 w-[34px] items-center justify-center rounded-full"
          hitSlop={8}
          onPress={() => setIsMenuVisible(true)}
        >
          <Menu color={colors.primary} size={22} strokeWidth={2.4} />
        </Pressable>

        <View pointerEvents="none" className="absolute left-[62px] top-4">
          <AppText className="text-2xl font-bold leading-8" style={{ color: colors.primary }}>
            LexiLoop
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={openProfile}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-full border-2"
            style={{ backgroundColor: colors.primarySoft, borderColor: colors.primary }}
          >
            <AppText className="text-sm font-bold" style={{ color: colors.primary }}>
              {initial}
            </AppText>
          </View>
        </Pressable>
      </View>

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <View className="flex-1 px-5" style={{ backgroundColor: 'rgba(2, 6, 23, 0.42)', paddingTop: insets.top + 12 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close quick actions" className="absolute inset-0" onPress={() => setIsMenuVisible(false)} />
          <View className="w-[274px] overflow-hidden rounded-2xl border shadow-2xl" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between border-b px-4 py-3" style={{ borderColor: colors.border }}>
              <AppText className="text-base font-bold" style={{ color: colors.text }}>
                Quick Actions
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close quick actions"
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.primarySoft }}
                onPress={() => setIsMenuVisible(false)}
              >
                <X color={colors.primary} size={17} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View className="py-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Pressable
                    key={action.label}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    className="min-h-[62px] flex-row items-center gap-3 px-4 py-2"
                    onPress={() => openAction(action.href)}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.primarySoft }}>
                      <Icon color={colors.primary} size={20} strokeWidth={2.4} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <AppText className="text-base font-semibold leading-6" style={{ color: colors.text }}>
                        {action.label}
                      </AppText>
                      <AppText className="text-sm leading-5" style={{ color: colors.muted }} numberOfLines={1}>
                        {action.description}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
