import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { formatInr } from '@/features/payments/money';
import { useHostSessions, useSetSessionHostConfirmation } from '@/features/sessions/hooks';
import { useAuthStore } from '@/store/authStore';

export default function HostEarningsScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const { data: sessions, isLoading, isError, refetch } = useHostSessions(profile?.uid ?? null);
  const setConfirmation = useSetSessionHostConfirmation(profile?.uid ?? null);

  const completed = useMemo(() => (sessions ?? []).filter((s) => s.endedAt), [sessions]);
  const totalEarned = useMemo(
    () =>
      completed
        .filter((s) => s.paymentStatus === 'paid')
        .reduce((sum, s) => sum + (s.hostPayoutAmount ?? 0), 0),
    [completed],
  );

  return (
    <Screen scroll className="gap-4 pt-4">
      <Text className="text-xl font-bold">{t('host.earnings')}</Text>

      <View className="rounded-xl bg-muted p-4">
        <Text className="text-sm text-muted-foreground">{t('host.earnings')}</Text>
        <Text className="text-2xl font-bold">{formatInr(totalEarned)}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#16A34A" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : completed.length === 0 ? (
        <EmptyState title={t('notifications.empty')} />
      ) : (
        <View className="gap-3">
          {completed.map((session) => (
            <View key={session.id} className="gap-2 rounded-xl border border-border p-3">
              <Pressable onPress={() => router.push(`/session/${session.id}`)}>
                <Text className="font-semibold">{formatInr(session.hostPayoutAmount ?? 0)}</Text>
                <Text className="text-xs text-muted-foreground">
                  {session.durationMinutes} min · {session.paymentStatus}
                </Text>
              </Pressable>

              {!session.hostConfirmationStatus ? (
                <View className="flex-row gap-3">
                  <Button
                    label={t('host.confirmSession')}
                    className="flex-1"
                    loading={setConfirmation.isPending}
                    onPress={() => setConfirmation.mutate({ sessionId: session.id, status: 'confirmed' })}
                  />
                  <Button
                    label={t('host.disputeSession')}
                    variant="danger"
                    className="flex-1"
                    loading={setConfirmation.isPending}
                    onPress={() => setConfirmation.mutate({ sessionId: session.id, status: 'disputed' })}
                  />
                </View>
              ) : (
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-muted-foreground">{session.hostConfirmationStatus}</Text>
                  {session.paymentStatus === 'paid' ? (
                    <Button
                      label={t('host.rateChargee')}
                      variant="ghost"
                      onPress={() => router.push(`/review/${session.id}`)}
                    />
                  ) : null}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
