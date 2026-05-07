import { TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './app-text';

type FormInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormInput({ label, error, className = '', ...props }: FormInputProps & { className?: string }) {
  return (
    <View className="gap-2">
      <AppText className="font-semibold">{label}</AppText>
      <TextInput
        className={`min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-ink ${className}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error ? <AppText className="text-sm text-danger">{error}</AppText> : null}
    </View>
  );
}
