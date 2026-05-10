import { Text, TextProps } from 'react-native';
import { useAppTheme } from '@/lib/theme-provider';

export function AppText({ className = '', style, ...props }: TextProps & { className?: string }) {
  const { colors } = useAppTheme();
  const hasExplicitColor = /\btext-(white|black|ink|muted|danger|success|warning|primary|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d+)?\b/.test(className);

  return <Text className={`text-ink ${className}`} style={[hasExplicitColor ? null : { color: colors.text }, style]} {...props} />;
}
