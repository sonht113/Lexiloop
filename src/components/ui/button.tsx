import { Pressable, PressableProps } from 'react-native';
import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  className?: string;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600',
  secondary: 'bg-primary-50',
  danger: 'bg-red-50',
  ghost: 'bg-transparent',
};

const textClass: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-primary-700',
  danger: 'text-danger',
  ghost: 'text-ink',
};

export function Button({ title, variant = 'primary', className = '', disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      className={`min-h-12 items-center justify-center rounded-2xl px-5 ${variantClass[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      <AppText className={`font-semibold ${textClass[variant]}`}>{title}</AppText>
    </Pressable>
  );
}
