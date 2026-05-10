import { PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/lib/theme-provider';

export function Screen({ children, className = '', style, ...props }: PropsWithChildren<ViewProps & { className?: string }>) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView className={`flex-1 bg-canvas px-5 ${className}`} style={[{ backgroundColor: colors.canvas }, style]} {...props}>
      {children}
    </SafeAreaView>
  );
}
