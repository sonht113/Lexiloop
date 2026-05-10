import { createContext, type PropsWithChildren, type RefObject, useContext } from 'react';
import { findNodeHandle, ScrollView, TextInput, TextInputProps, UIManager, View } from 'react-native';
import { useAppTheme } from '@/lib/theme-provider';
import { AppText } from './app-text';

type FormInputProps = TextInputProps & {
  label: string;
  error?: string;
};

type KeyboardAwareScrollContextValue = {
  extraOffset: number;
  scrollViewRef: RefObject<ScrollView | null>;
};

const KeyboardAwareScrollContext = createContext<KeyboardAwareScrollContextValue | null>(null);

export function KeyboardAwareScrollProvider({
  children,
  extraOffset = 96,
  scrollViewRef,
}: PropsWithChildren<{ extraOffset?: number; scrollViewRef: RefObject<ScrollView | null> }>) {
  return <KeyboardAwareScrollContext.Provider value={{ extraOffset, scrollViewRef }}>{children}</KeyboardAwareScrollContext.Provider>;
}

export function FormInput({ label, error, className = '', onFocus, style, ...props }: FormInputProps & { className?: string }) {
  const keyboardAwareScroll = useContext(KeyboardAwareScrollContext);
  const { colors } = useAppTheme();

  const scrollFocusedInputIntoView: TextInputProps['onFocus'] = (event) => {
    onFocus?.(event);

    if (!keyboardAwareScroll?.scrollViewRef.current) return;

    const scrollViewNode = findNodeHandle(keyboardAwareScroll.scrollViewRef.current);
    if (!scrollViewNode) return;

    const inputNode = event.nativeEvent.target;

    setTimeout(() => {
      UIManager.measureLayout(
        inputNode,
        scrollViewNode,
        () => undefined,
        (_x, y) => {
          keyboardAwareScroll.scrollViewRef.current?.scrollTo({
            animated: true,
            y: Math.max(y - keyboardAwareScroll.extraOffset, 0),
          });
        },
      );
    }, 80);
  };

  return (
    <View className="gap-2">
      <AppText className="font-semibold">{label}</AppText>
      <TextInput
        className={`min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-ink ${className}`}
        style={[{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, style]}
        onFocus={scrollFocusedInputIntoView}
        placeholderTextColor={colors.muted}
        {...props}
      />
      {error ? <AppText className="text-sm text-danger">{error}</AppText> : null}
    </View>
  );
}
