import { PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children, className = '', ...props }: PropsWithChildren<ViewProps & { className?: string }>) {
  return (
    <SafeAreaView className={`flex-1 bg-canvas px-5 ${className}`} {...props}>
      {children}
    </SafeAreaView>
  );
}
