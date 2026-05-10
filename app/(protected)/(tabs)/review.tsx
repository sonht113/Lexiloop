import { Link } from 'expo-router';
import { ScrollView } from 'react-native';
import { AppText, Button, Card, EmptyState, Screen } from '@/components/ui';
import { useDueWordsQuery } from '@/features/review/review-hooks';
import { useAppTheme } from '@/lib/theme-provider';

export default function ReviewLandingScreen() {
  const dueWords = useDueWordsQuery();
  const { colors } = useAppTheme();
  const dueCount = dueWords.data?.length ?? 0;

  return (
    <Screen className="pt-6">
      <ScrollView contentContainerClassName="gap-5 pb-8" showsVerticalScrollIndicator={false}>
        <AppText className="text-3xl font-bold" style={{ color: colors.text }}>
          Review
        </AppText>
        <Card className="gap-3">
          <AppText className="text-xl font-semibold" style={{ color: colors.text }}>
            Daily review
          </AppText>
          <AppText style={{ color: colors.muted }}>
            {dueCount > 0 ? `${dueCount} words are due today.` : "You're all caught up. Great job."}
          </AppText>
          <Link href="/(protected)/review/session" asChild>
            <Button title={dueCount > 0 ? 'Start daily review' : 'No words due'} disabled={dueCount === 0} />
          </Link>
        </Card>
        {dueWords.isError ? <EmptyState title="Couldn't load review" description="Please try again later." /> : null}
      </ScrollView>
    </Screen>
  );
}
