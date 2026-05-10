import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, Card, FormInput, Screen, useAppAlert } from '@/components/ui';
import { useSignUpMutation } from '@/features/auth/auth-hooks';
import { usernameSchema } from '@/features/auth/auth-utils';
import { useAppTheme } from '@/lib/theme-provider';

const signUpSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
  const signUp = useSignUpMutation();
  const { colors } = useAppTheme();
  const appAlert = useAppAlert();
  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', password: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async ({ username, password }) => {
    try {
      await signUp.mutateAsync({ username, password });
    } catch (error) {
      appAlert.show({ title: 'Sign up failed', message: error instanceof Error ? error.message : 'Please try again.', variant: 'danger' });
    }
  });

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen className="justify-center">
        <Card className="gap-5">
          <View>
            <AppText className="text-3xl font-bold" style={{ color: colors.text }}>Create account</AppText>
            <AppText className="mt-2" style={{ color: colors.muted }}>Start with your default Daily Life deck.</AppText>
          </View>
          <Controller control={form.control} name="username" render={({ field, fieldState }) => (
            <FormInput label="Username" autoCapitalize="none" autoCorrect={false} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )} />
          <Controller control={form.control} name="password" render={({ field, fieldState }) => (
            <FormInput label="Password" secureTextEntry value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )} />
          <Controller control={form.control} name="confirmPassword" render={({ field, fieldState }) => (
            <FormInput label="Confirm password" secureTextEntry value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )} />
          <Button title={signUp.isPending ? 'Creating account...' : 'Create account'} disabled={signUp.isPending} onPress={onSubmit} />
          <Link href="/(auth)/sign-in" asChild><Button title="I already have an account" variant="ghost" /></Link>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
