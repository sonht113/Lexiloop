import type { ComponentType } from "react";
import {
  Bookmark,
  Code2,
  GraduationCap,
  Globe2,
  Heart,
  Layers,
  Plane,
  Utensils,
} from "lucide-react-native";

type DeckIconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

export const deckIconKeys = [
  "layers",
  "bookmark",
  "graduation-cap",
  "globe",
  "code",
  "plane",
  "utensils",
  "heart",
] as const;

export type DeckIconKey = (typeof deckIconKeys)[number];

export const DEFAULT_DECK_ICON: DeckIconKey = "layers";
export const DEFAULT_DECK_COLOR = "#4f46e5";

const legacyIconMap: Record<string, DeckIconKey> = {
  book: "bookmark",
  "book-open": "layers",
  coffee: "utensils",
  code: "code",
  globe: "globe",
  plane: "plane",
};

const iconMap: Record<DeckIconKey, DeckIconComponent> = {
  layers: Layers,
  bookmark: Bookmark,
  "graduation-cap": GraduationCap,
  globe: Globe2,
  code: Code2,
  plane: Plane,
  utensils: Utensils,
  heart: Heart,
};

export function normalizeDeckIconKey(icon?: string | null): DeckIconKey {
  if (!icon) return DEFAULT_DECK_ICON;
  if (isDeckIconKey(icon)) return icon;
  return legacyIconMap[icon] ?? DEFAULT_DECK_ICON;
}

export function DeckIcon({
  icon,
  color = "#464555",
  size = 24,
  strokeWidth = 2.4,
}: {
  icon?: string | null;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = iconMap[normalizeDeckIconKey(icon)];
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />;
}

function isDeckIconKey(icon: string): icon is DeckIconKey {
  return deckIconKeys.includes(icon as DeckIconKey);
}
