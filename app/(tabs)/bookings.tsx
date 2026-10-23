import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { useChargeeBookings } from '@/features/bookings/hooks';
import { useCharger } from '@/features/chargers/hooks';
import { formatInr } from '@/features/payments/money';
import { useAuthStore } from '@/store/authStore';
import type { Booking, BookingStatus } from '@/types';

const STATUS_LABEL_KEY: Record<BookingStatus, string> = {
  pending: 'booking.statusPending',
  accepted: 'booking.statusAccepted',
  declined: 'booking.statusDeclined',
  cancelled: 'booking.statusCancelled',
  completed: 'booking.statusCompleted',
};

function BookingRow({ booking }: { booking: Booking }) {
  const { t } = useTranslation();
  const { data: charger } = useCharger(booking.chargerId);

  return (
    <Pressable
      onPress={() => router.push(`/booking/${booking.id}`)}
      className="gap-1 rounded-xl border border-border p-3"
    >
      <Text className="font-semibold">{charger?.address ?? '…'}</Text>
      <Text className="text-sm text-muted-foreground">{t(STATUS_LABEL_KEY[booking.status])}</Text>
      <Text className="text-sm text-muted-foreground">
        {new Date(booking.requestedStart).toLocaleString()} · {formatInr(booking.estimatedCost)}
      </Text>
    </Pressable>
  );
}

export default function BookingsScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const { data: bookings, isLoading, isError, refetch } = useChargeeBookings(profile?.uid ?? null);

  return (
    <Screen scroll className="gap-3 pt-4">
      <Text className="text-xl font-bold">{t('tabs.bookings')}</Text>
      {isLoading ? (
        <ActivityIndicator color="#16A34A" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : bookings && bookings.length > 0 ? (
        <View className="gap-3">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </View>
      ) : (
        <EmptyState title={t('notifications.empty')} />
      )}
    </Screen>
  );
}
