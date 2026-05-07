import { PropsWithChildren } from 'react';
import { SafeAreaView, ViewProps } from 'react-native';

export function Screen({ children, className = '', ...props }: PropsWithChildren<ViewProps & { className?: string }>) {
  return (
    <SafeAreaView className={`flex-1 bg-canvas px-5 ${className}`} {...props}>
      {children}
    </SafeAreaView>
  );
}
