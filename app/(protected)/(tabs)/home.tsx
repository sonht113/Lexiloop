import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { AppText, Button, Card, EmptyState, Screen } from '@/components/ui';
import { useHomeStatsQuery } from '@/features/home/home-hooks';

export default function HomeScreen() {
  const stats = useHomeStatsQuery();
  const dueCount = stats.data?.dueCount ?? 0;

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-5 pb-8" showsVerticalScrollIndicator={false}>
        <AppText className="text-3xl font-bold">Today</AppText>
        <Card className="gap-4 bg-primary-600">
          <AppText className="text-4xl font-bold text-white">{dueCount} words due</AppText>
          <AppText className="text-primary-100">Keep the loop gentle and consistent.</AppText>
          <Link href="/(protected)/review/session" asChild>
            <Button title={dueCount > 0 ? 'Start Review' : 'All caught up'} variant="secondary" disabled={dueCount === 0} />
          </Link>
        </Card>
        {stats.isError ? <EmptyState title="Couldn’t load stats" description="Please try again later." /> : null}
        <View className="flex-row gap-3">
          <Card className="flex-1"><AppText className="text-2xl font-bold">{stats.data?.totalWords ?? '—'}</AppText><AppText className="text-muted">Words</AppText></Card>
          <Card className="flex-1"><AppText className="text-2xl font-bold">{stats.data?.masteredWords ?? '—'}</AppText><AppText className="text-muted">Mastered</AppText></Card>
        </View>
        <View className="flex-row gap-3">
          <Card className="flex-1"><AppText className="text-2xl font-bold">{stats.data?.accuracy ?? '—'}{stats.data?.accuracy != null ? '%' : ''}</AppText><AppText className="text-muted">Accuracy</AppText></Card>
          <Card className="flex-1"><AppText className="text-2xl font-bold">20:00</AppText><AppText className="text-muted">Reminder</AppText></Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
