import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { useCharger } from '@/features/chargers/hooks';
import { setBookingStatus } from '@/features/bookings/api';
import { computeSessionCost, formatInr } from '@/features/payments/money';
import { captureAndUploadPhoto } from '@/services/cameraUpload';
import { useEndSession, useSession, useStartSession } from '@/features/sessions/hooks';

export default function SessionScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading, isError, refetch } = useSession(id ?? null);
  const { data: charger } = useCharger(session?.chargerId ?? null);
  const startSession = useStartSession(id ?? '');
  const endSession = useEndSession(id ?? '');
  const [isCapturing, setIsCapturing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session?.startedAt || session.endedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session?.startedAt, session?.endedAt]);

  if (isError) {
    return (
      <Screen>
        <ErrorView onRetry={refetch} />
      </Screen>
    );
  }

  if (isLoading || !session || !charger) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color="#16A34A" />
      </Screen>
    );
  }

  const isRunning = Boolean(session.startedAt) && !session.endedAt;
  const elapsedMinutes = isRunning ? Math.max(0, (now - (session.startedAt as number)) / 60_000) : 0;
  const liveCost = isRunning
    ? computeSessionCost(session.hourlyRateAtBooking, elapsedMinutes, charger.minSessionCharge).totalAmount
    : null;

  async function handleStart() {
    setIsCapturing(true);
    try {
      const url = await captureAndUploadPhoto(`sessions/${id}/start.jpg`);
      if (url) await startSession.mutateAsync(url);
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleStop() {
    if (!session || !charger || !session.startedAt) return;
    setIsCapturing(true);
    try {
      const url = await captureAndUploadPhoto(`sessions/${id}/end.jpg`);
      if (!url) return;
      await endSession.mutateAsync({
        endPhotoUrl: url,
        startedAt: session.startedAt,
        hourlyRateAtBooking: session.hourlyRateAtBooking,
        minSessionCharge: charger.minSessionCharge,
      });
      await setBookingStatus(session.bookingId, 'completed');
      router.replace(`/payment/${session.id}`);
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <Screen className="flex-1 items-center justify-center gap-6">
      <Text className="text-center text-sm text-muted-foreground">{t('session.billingNotice')}</Text>

      {isRunning ? (
        <View className="items-center gap-2">
          <Text className="text-sm text-muted-foreground">{t('session.elapsed')}</Text>
          <Text className="text-4xl font-bold">
            {String(Math.floor(elapsedMinutes)).padStart(2, '0')}:
            {String(Math.floor((elapsedMinutes % 1) * 60)).padStart(2, '0')}
          </Text>
          <Text className="text-sm text-muted-foreground">{t('session.runningCost')}</Text>
          <Text className="text-2xl font-semibold">{formatInr(liveCost ?? 0)}</Text>
        </View>
      ) : session.endedAt ? (
        <View className="items-center gap-2">
          <Text className="text-lg font-semibold">{formatInr(session.totalAmount ?? 0)}</Text>
          <Text className="text-sm text-muted-foreground">{session.durationMinutes} min</Text>
        </View>
      ) : (
        <Text className="text-center text-muted-foreground">{t('session.takeStartPhoto')}</Text>
      )}

      {!session.startedAt ? (
        <Button label={t('session.startCharging')} loading={isCapturing} onPress={handleStart} />
      ) : !session.endedAt ? (
        <Button label={t('session.stopCharging')} variant="danger" loading={isCapturing} onPress={handleStop} />
      ) : null}
    </Screen>
  );
}
