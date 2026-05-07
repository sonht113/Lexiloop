import { Alert, ScrollView, View } from 'react-native';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useSignOutMutation } from '@/features/auth/auth-hooks';
import { useProfileStatsQuery } from '@/features/profile/profile-hooks';

export default function ProfileScreen() {
  const stats = useProfileStatsQuery();
  const signOut = useSignOutMutation();

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You can sign in again anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut.mutate() },
    ]);
  };

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-5 pb-8" showsVerticalScrollIndicator={false}>
        <View className="items-center gap-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <AppText className="text-3xl font-bold text-primary-700">{stats.data?.profile.username?.slice(0, 1).toUpperCase() ?? 'L'}</AppText>
          </View>
          <AppText className="text-2xl font-bold">{stats.data?.profile.username ?? 'Learner'}</AppText>
          <AppText className="text-muted">Enthusiastic Learner</AppText>
        </View>
        <View className="flex-row gap-3">
          <Card className="flex-1"><AppText className="text-2xl font-bold">{stats.data?.totalWords ?? '—'}</AppText><AppText className="text-muted">Total words</AppText></Card>
          <Card className="flex-1"><AppText className="text-2xl font-bold">{stats.data?.masteredWords ?? '—'}</AppText><AppText className="text-muted">Mastered</AppText></Card>
        </View>
        <View className="flex-row gap-3">
          <Card className="flex-1"><AppText className="text-2xl font-bold">{stats.data?.accuracy ?? '—'}{stats.data?.accuracy != null ? '%' : ''}</AppText><AppText className="text-muted">Accuracy</AppText></Card>
          <Card className="flex-1"><AppText className="text-2xl font-bold">{stats.data?.totalReviews ?? '—'}</AppText><AppText className="text-muted">Reviews</AppText></Card>
        </View>
        <Card><AppText className="font-semibold">Daily Reminder</AppText><AppText className="mt-1 text-muted">Configure reminder in the next screen.</AppText></Card>
        <Button title={signOut.isPending ? 'Signing out...' : 'Sign out'} variant="danger" disabled={signOut.isPending} onPress={confirmSignOut} />
      </ScrollView>
    </Screen>
  );
}
