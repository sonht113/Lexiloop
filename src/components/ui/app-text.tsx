import { Text, TextProps } from 'react-native';

export function AppText({ className = '', ...props }: TextProps & { className?: string }) {
  return <Text className={`text-ink ${className}`} {...props} />;
}
