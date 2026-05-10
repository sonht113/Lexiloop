import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { AppText, EmptyState, KeyboardAwareScrollProvider, Screen } from '@/components/ui';
import { useDecksQuery } from '@/features/decks/deck-hooks';
import { WordForm } from '@/features/words/word-form';
import { useAppTheme } from '@/lib/theme-provider';

export default function QuickAddScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const decks = useDecksQuery();
  const defaultDeck = decks.data?.[0];

  return (
    <Screen className="pt-6">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1" keyboardVerticalOffset={16}>
        <KeyboardAwareScrollProvider scrollViewRef={scrollViewRef}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="gap-5 pb-28"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to home"
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primarySoft }}
              onPress={() => router.replace('/(protected)/(tabs)/home')}
            >
              <ArrowLeft color={colors.text} size={20} />
            </Pressable>
            <AppText className="text-3xl font-bold" style={{ color: colors.text }}>Quick Add</AppText>
          </View>
          {decks.isLoading ? <AppText style={{ color: colors.muted }}>Loading decks...</AppText> : null}
          {decks.data?.length === 0 ? <EmptyState title="No deck available" description="Create a deck before adding words." /> : null}
          {defaultDeck ? <WordForm defaultDeckId={defaultDeck.id} onSuccess={(mode) => mode === 'done' && router.back()} /> : null}
        </ScrollView>
        </KeyboardAwareScrollProvider>
      </KeyboardAvoidingView>
    </Screen>
  );
}
