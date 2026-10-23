import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { useUserProfile } from '@/features/auth/hooks';
import { useHostPendingBookings, useSetBookingStatus } from '@/features/bookings/hooks';
import { useCharger } from '@/features/chargers/hooks';
import { formatInr } from '@/features/payments/money';
import { useAuthStore } from '@/store/authStore';
import type { Booking } from '@/types';

function RequestCard({ booking }: { booking: Booking }) {
  const { t } = useTranslation();
  const { data: charger } = useCharger(booking.chargerId);
  const { data: chargee } = useUserProfile(booking.chargeeId);
  const setStatus = useSetBookingStatus();

  return (
    <View className="gap-2 rounded-xl border border-border p-3">
      <Text className="font-semibold">{charger?.address ?? '…'}</Text>
      <Text className="text-sm text-muted-foreground">{chargee?.name ?? '…'}</Text>
      <Text className="text-sm text-muted-foreground">
        {new Date(booking.requestedStart).toLocaleString()} · {formatInr(booking.estimatedCost)}
      </Text>
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
    </View>
  );
}

export default function HostRequestsScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const { data: bookings, isLoading, isError, refetch } = useHostPendingBookings(profile?.uid ?? null);

  return (
    <Screen scroll className="gap-3 pt-4">
      <Text className="text-xl font-bold">{t('host.incomingRequests')}</Text>
      {isLoading ? (
        <ActivityIndicator color="#16A34A" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : bookings && bookings.length > 0 ? (
        bookings.map((booking) => <RequestCard key={booking.id} booking={booking} />)
      ) : (
        <EmptyState title={t('notifications.empty')} />
      )}
    </Screen>
  );
}
