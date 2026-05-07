import { PropsWithChildren } from 'react';
import { View, ViewProps } from 'react-native';

export function Card({ children, className = '', ...props }: PropsWithChildren<ViewProps & { className?: string }>) {
  return (
    <View className={`rounded-xl3 bg-white p-5 shadow-sm ${className}`} {...props}>
      {children}
    </View>
  );
}
