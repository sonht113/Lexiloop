import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BookOpen } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui';
import { useSessionQuery } from '@/features/auth/auth-hooks';
import { setOnboardingSeen } from '@/lib/onboarding-storage';
import { useAppTheme } from '@/lib/theme-provider';

type OnboardingSlide = {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  imageKind: 'photo' | 'illustration';
};

const slides: OnboardingSlide[] = [
  {
    title: 'Learn words that\nmatter',
    subtitle: 'Create your own vocabulary decks and study\nat your pace.',
    image: require('../assets/slide-1.png'),
    imageKind: 'photo',
  },
  {
    title: 'Review at the right\ntime',
    subtitle: 'LexiLoop helps you remember with\nsimple spaced repetition.',
    image: require('../assets/slide-2.png'),
    imageKind: 'illustration',
  },
  {
    title: 'Build a daily habit',
    subtitle: 'Set reminders and keep your learning streak\nalive.',
    image: require('../assets/slide-3.png'),
    imageKind: 'illustration',
  },
];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const { data: session } = useSessionQuery();
  const { colors, isDark } = useAppTheme();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const imageSize = useMemo(() => {
    const maxByHeight = height < 760 ? height * 0.33 : height * 0.42;
    return Math.min(width - 40, 350, maxByHeight);
  }, [height, width]);

  const currentSlide = slides[currentIndex];
  const isLastSlide = currentIndex === slides.length - 1;

  const completeOnboarding = useCallback(
    async (destination: 'sign-in' | 'sign-up') => {
      if (isCompleting) return;

      setIsCompleting(true);
      try {
        await setOnboardingSeen();
      } finally {
        if (session) {
          router.replace('/(protected)/(tabs)/home');
        } else if (destination === 'sign-up') {
          router.replace('/(auth)/sign-up');
        } else {
          router.replace('/(auth)/sign-in');
        }
      }
    },
    [isCompleting, session],
  );

  const goNext = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= slides.length) {
      void completeOnboarding('sign-up');
      return;
    }

    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setCurrentIndex(nextIndex);
  }, [completeOnboarding, currentIndex]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / imageSize);
      setCurrentIndex(nextIndex);
    },
    [imageSize],
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View className="flex-1 px-5 pb-8 pt-4">
        <AppText className="text-center text-3xl font-bold" style={{ color: colors.primary }}>LexiLoop</AppText>

        <View className="flex-1 justify-center">
          <View className="items-center">
            <FlatList
              ref={listRef}
              data={slides}
              keyExtractor={(item) => item.title}
              horizontal
              pagingEnabled
              bounces={false}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              getItemLayout={(_, index) => ({ length: imageSize, offset: imageSize * index, index })}
              style={{ height: imageSize, width: imageSize }}
              renderItem={({ item }) => (
                <View className="items-center justify-center" style={{ height: imageSize, width: imageSize }}>
                  {item.imageKind === 'photo' ? (
                    <View
                      className="overflow-hidden rounded-[24px]"
                      style={{ height: imageSize, width: imageSize, backgroundColor: colors.primarySoft }}
                    >
                      <Image source={item.image} className="h-full w-full" resizeMode="cover" />
                      <View className="absolute inset-0 items-center justify-center">
                        <View className="h-28 w-28 items-center justify-center rounded-[24px] shadow-sm" style={{ backgroundColor: colors.surface }}>
                          <BookOpen color={colors.primary} size={52} strokeWidth={3} />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <Image source={item.image} resizeMode="contain" style={{ height: imageSize, width: imageSize }} />
                  )}
                </View>
              )}
            />
          </View>

          <View className="mt-10 items-center">
            <AppText className="text-center text-4xl font-bold leading-[44px]" style={{ color: colors.text }}>
              {currentSlide.title}
            </AppText>
            <AppText className="mt-5 text-center text-xl leading-8" style={{ color: colors.muted }}>
              {currentSlide.subtitle}
            </AppText>
          </View>
        </View>

        <View className="items-center">
          <View className="mb-10 flex-row items-center justify-center gap-2">
            {slides.map((slide, dotIndex) => (
              <View
                key={slide.title}
                className={`h-2 rounded-full ${dotIndex === currentIndex ? 'w-8' : 'w-2'}`}
                style={{ backgroundColor: dotIndex === currentIndex ? colors.primary : colors.border }}
              />
            ))}
          </View>

          <Pressable
            className={`h-14 w-full items-center justify-center rounded-xl ${isCompleting ? 'opacity-60' : ''}`}
            style={{ backgroundColor: colors.primary }}
            disabled={isCompleting}
            onPress={() => (isLastSlide ? void completeOnboarding('sign-up') : goNext())}
          >
            <AppText className="text-lg font-medium text-white">
              {isLastSlide ? 'Get started' : 'Next'}
            </AppText>
          </Pressable>

          <Pressable
            className={`mt-5 h-12 items-center justify-center px-4 ${isCompleting ? 'opacity-60' : ''}`}
            disabled={isCompleting}
            onPress={() => void completeOnboarding('sign-in')}
          >
            <AppText className="text-lg font-medium" style={{ color: isLastSlide ? colors.primary : colors.muted }}>
              {isLastSlide ? 'I already have an account' : 'Skip'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
