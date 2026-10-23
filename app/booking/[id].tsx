import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { useBooking, useSetBookingStatus } from '@/features/bookings/hooks';
import { useCharger } from '@/features/chargers/hooks';
import { formatInr } from '@/features/payments/money';
import { useAuthStore } from '@/store/authStore';
import type { BookingStatus } from '@/types';

const STATUS_LABEL_KEY: Record<BookingStatus, string> = {
  pending: 'booking.statusPending',
  accepted: 'booking.statusAccepted',
  declined: 'booking.statusDeclined',
  cancelled: 'booking.statusCancelled',
  completed: 'booking.statusCompleted',
};

export default function BookingDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch } = useBooking(id ?? null);
  const { data: charger } = useCharger(booking?.chargerId ?? null);
  const currentUid = useAuthStore((s) => s.firebaseUid);
  const setStatus = useSetBookingStatus();

  if (isError) {
    return (
      <Screen>
        <ErrorView onRetry={refetch} />
      </Screen>
    );
  }

  if (isLoading || !booking) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color="#16A34A" />
      </Screen>
    );
  }

  const isHost = currentUid === booking.hostId;
  const isChargee = currentUid === booking.chargeeId;

  return (
    <Screen className="gap-4 pt-4">
      <Text className="text-xl font-bold">{charger?.address ?? t('booking.title')}</Text>
      <Text className="text-base text-muted-foreground">{t(STATUS_LABEL_KEY[booking.status])}</Text>

      <View className="gap-1 rounded-xl bg-muted p-3">
        <Text className="text-sm text-muted-foreground">{t('booking.estimatedCost')}</Text>
        <Text className="text-xl font-bold">{formatInr(booking.estimatedCost)}</Text>
      </View>

      <Text className="text-sm text-muted-foreground">
        {new Date(booking.requestedStart).toLocaleString()} → {new Date(booking.requestedEnd).toLocaleTimeString()}
      </Text>

      {isHost && booking.status === 'pending' ? (
        <View className="flex-row gap-3">
          <Button
            label={t('common.confirm')}
            className="flex-1"
            loading={setStatus.isPending}
            onPress={() => setStatus.mutate({ bookingId: booking.id, status: 'accepted' })}
          />
          <Button
            label={t('booking.statusDeclined')}
            variant="danger"
            className="flex-1"
            loading={setStatus.isPending}
            onPress={() => setStatus.mutate({ bookingId: booking.id, status: 'declined' })}
          />
        </View>
      ) : null}

      {isChargee && booking.status === 'pending' ? (
        <Button
          label={t('common.cancel')}
          variant="secondary"
          onPress={() => setStatus.mutate({ bookingId: booking.id, status: 'cancelled' })}
        />
      ) : null}

      {isChargee && booking.status === 'accepted' ? (
        <Button label={t('session.startCharging')} onPress={() => router.push(`/session/new?bookingId=${booking.id}`)} />
      ) : null}
    </Screen>
  );
}
