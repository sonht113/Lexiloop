import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useAppTheme } from '@/lib/theme-provider';

export function FloatingQuickAddButton() {
  const { colors } = useAppTheme();

  return (
    <Link href="/(protected)/word/quick-add" asChild>
      <Pressable className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: colors.primary }}>
        <Plus color="white" size={28} />
      </Pressable>
    </Link>
  );
}
