import { Pressable, View } from 'react-native';
import { AppText } from '@/components/ui';

const days = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export function RepeatDaysSelector({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  const toggle = (day: number) => {
    if (value.includes(day)) onChange(value.filter((item) => item !== day));
    else onChange([...value, day].sort());
  };

  return (
    <View className="gap-2">
      <AppText className="font-semibold">Repeat days</AppText>
      <View className="flex-row flex-wrap gap-2">
        {days.map((day) => {
          const selected = value.includes(day.value);
          return (
            <Pressable key={day.value} className={`rounded-full px-4 py-2 ${selected ? 'bg-primary-600' : 'bg-primary-50'}`} onPress={() => toggle(day.value)}>
              <AppText className={`font-semibold ${selected ? 'text-white' : 'text-primary-700'}`}>{day.label}</AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
