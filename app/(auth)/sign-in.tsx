import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, Card, FormInput, Screen, useAppAlert } from '@/components/ui';
import { useSignInMutation } from '@/features/auth/auth-hooks';
import { usernameSchema } from '@/features/auth/auth-utils';
import { useAppTheme } from '@/lib/theme-provider';

const signInSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required.'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInScreen() {
  const signIn = useSignInMutation();
  const { colors } = useAppTheme();
  const appAlert = useAppAlert();
  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn.mutateAsync(values);
    } catch (error) {
      appAlert.show({ title: 'Sign in failed', message: error instanceof Error ? error.message : 'Please try again.', variant: 'danger' });
    }
  });

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen className="justify-center">
        <Card className="gap-5">
          <View>
            <AppText className="text-3xl font-bold" style={{ color: colors.text }}>Welcome back</AppText>
            <AppText className="mt-2" style={{ color: colors.muted }}>Sign in to continue your daily vocabulary loop.</AppText>
          </View>
          <Controller control={form.control} name="username" render={({ field, fieldState }) => (
            <FormInput label="Username" autoCapitalize="none" autoCorrect={false} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )} />
          <Controller control={form.control} name="password" render={({ field, fieldState }) => (
            <FormInput label="Password" secureTextEntry value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
          )} />
          <Button title={signIn.isPending ? 'Signing in...' : 'Sign in'} disabled={signIn.isPending} onPress={onSubmit} />
          <Link href="/(auth)/sign-up" asChild><Button title="Create account" variant="secondary" /></Link>
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}
