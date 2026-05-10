import { PropsWithChildren } from 'react';
import { View, ViewProps } from 'react-native';
import { useAppTheme } from '@/lib/theme-provider';

export function Card({ children, className = '', style, ...props }: PropsWithChildren<ViewProps & { className?: string }>) {
  const { colors } = useAppTheme();

  return (
    <View
      className={`rounded-xl3 bg-white p-5 shadow-sm ${className}`}
      style={[{ backgroundColor: colors.surface, borderColor: colors.border }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
