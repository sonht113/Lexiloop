import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { AppText } from './app-text';

export function EmptyState({ title, description, children }: PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <View className="items-center justify-center rounded-xl3 border border-dashed border-slate-200 bg-white p-8">
      <AppText className="text-center text-lg font-semibold">{title}</AppText>
      {description ? <AppText className="mt-2 text-center text-muted">{description}</AppText> : null}
      {children ? <View className="mt-5">{children}</View> : null}
    </View>
  );
}
