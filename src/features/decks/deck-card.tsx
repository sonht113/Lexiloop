import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { AppText, useAppAlert } from '@/components/ui';
import { useAppTheme } from '@/lib/theme-provider';
import { DEFAULT_DECK_COLOR, DeckIcon } from './deck-icons';
import { useDeleteDeckMutation, type DeckWithStats } from './deck-hooks';

export function DeckCard({
  deck,
  isMenuOpen,
  onToggleMenu,
  onEdit,
}: {
  deck: DeckWithStats;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onEdit?: (deck: DeckWithStats) => void;
}) {
  const deleteDeck = useDeleteDeckMutation();
  const appAlert = useAppAlert();
  const { colors, isDark } = useAppTheme();
  const masteryPercent = Math.max(0, Math.min(deck.mastery_percent ?? 0, 100));
  const dueCount = deck.due_count ?? 0;
  const dueTone = getDueTone(dueCount, colors, isDark);

  const confirmDelete = () => {
    appAlert.show({
      title: 'Delete this deck?',
      message: 'All words inside will also be deleted.',
      variant: 'danger',
      actions: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteDeck.mutate(deck.id) },
      ],
    });
  };

  return (
    <View className="relative min-h-[198px] rounded-xl p-4 shadow-sm" style={{ backgroundColor: colors.surface }}>
      <Link href={`/(protected)/deck/${deck.id}`} asChild>
        <Pressable className="flex-1">
          <View className="flex-row items-start justify-between">
            <View
              className="h-12 w-12 items-center justify-center rounded-lg shadow-sm"
              style={{ backgroundColor: normalizeDeckColor(deck.color) }}
            >
              <DeckIcon icon={deck.icon} color="#ffffff" size={25} />
            </View>
            <View className="flex-row items-center gap-2">
              <View className="rounded-md px-2 py-1" style={{ backgroundColor: dueTone.background }}>
                <AppText className="text-xs font-medium leading-4" style={{ color: dueTone.text }}>
                  {dueCount} due
                </AppText>
              </View>
              {onToggleMenu ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open actions for ${deck.name}`}
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation();
                    onToggleMenu();
                  }}
                  className="h-8 w-8 items-center justify-center rounded-full"
                >
                  <MoreHorizontal color={colors.muted} size={20} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View className="mt-4">
            <AppText className="text-lg font-semibold leading-6" style={{ color: colors.text }}>{deck.name}</AppText>
            <AppText className="mt-1 text-[13px] leading-[18px]" style={{ color: colors.muted }}>{deck.word_count ?? 0} words</AppText>
          </View>

          <View className="mt-4 pt-2">
            <View className="flex-row items-center justify-between">
              <AppText className="text-[13px] leading-[18px]" style={{ color: colors.muted }}>Mastery</AppText>
              <AppText className="text-[13px] font-medium leading-[18px]" style={{ color: colors.primary }}>
                {masteryPercent}%
              </AppText>
            </View>
            <View className="mt-1 h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.primarySoft }}>
              <View className="h-2 rounded-full" style={{ width: `${masteryPercent}%`, backgroundColor: getMasteryColor(masteryPercent, colors.primary, colors.success) }} />
            </View>
          </View>
        </Pressable>
      </Link>

      {isMenuOpen ? (
        <View className="absolute right-4 top-14 z-10 min-w-32 rounded-xl border p-1 shadow-lg" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Pressable
            className="rounded-lg px-3 py-2"
            onPress={() => {
              onToggleMenu?.();
              onEdit?.(deck);
            }}
          >
            <AppText className="font-medium" style={{ color: colors.text }}>Edit</AppText>
          </Pressable>
          <Pressable
            className="rounded-lg px-3 py-2"
            onPress={() => {
              onToggleMenu?.();
              confirmDelete();
            }}
          >
            <AppText className="font-medium text-danger">Delete</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function normalizeDeckColor(color?: string | null) {
  if (!color) return DEFAULT_DECK_COLOR;
  if (color.toLowerCase() === '#6366f1') return '#f0ecf9';
  return color;
}

function getDueTone(dueCount: number, colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) {
  if (!isDark) {
    if (dueCount <= 0) return { background: '#e4e1ee', text: colors.muted };
    if (dueCount >= 10) return { background: '#f59e0b33', text: colors.warning };
    return { background: '#ffdad6', text: '#93000a' };
  }

  if (dueCount <= 0) return { background: colors.border, text: colors.muted };
  if (dueCount >= 10) return { background: '#3f2b12', text: colors.warning };
  return { background: '#3f1d26', text: '#fecdd3' };
}

function getMasteryColor(masteryPercent: number, primary: string, success: string) {
  if (masteryPercent >= 80) return success;
  if (masteryPercent >= 50) return primary;
  return '#674bb5';
}
