import { Link } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';

export function FloatingQuickAddButton() {
  return (
    <Link href="/(protected)/word/quick-add" asChild>
      <Pressable className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary-600 shadow-lg">
        <Plus color="white" size={28} />
      </Pressable>
    </Link>
  );
}
