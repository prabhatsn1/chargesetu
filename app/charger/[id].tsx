import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { useUserProfile } from '@/features/auth/hooks';
import { useUpcomingBookingsForCharger } from '@/features/bookings/hooks';
import { isAvailableNow } from '@/features/chargers/availability';
import { AvailabilitySummary } from '@/features/chargers/AvailabilitySummary';
import { useCharger } from '@/features/chargers/hooks';
import { formatInr } from '@/features/payments/money';
import { ReportUserModal } from '@/features/reports/ReportUserModal';
import { useAuthStore } from '@/store/authStore';

export default function ChargerDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: charger, isLoading, isError, refetch } = useCharger(id ?? null);
  const { data: host } = useUserProfile(charger?.hostId ?? null);
  const currentUid = useAuthStore((s) => s.firebaseUid);
  const [reportVisible, setReportVisible] = useState(false);
  const isOwnCharger = currentUid !== null && charger?.hostId === currentUid;
  const { data: upcomingBookings } = useUpcomingBookingsForCharger(isOwnCharger ? (charger?.id ?? null) : null);

  if (isError) {
    return (
      <Screen>
        <ErrorView onRetry={refetch} />
      </Screen>
    );
  }

  if (isLoading || !charger) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color="#16A34A" />
      </Screen>
    );
  }

  const available = isAvailableNow(charger.availabilitySchedule);

  return (
    <Screen scroll className="gap-4 pt-2">
      {charger.photos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {charger.photos.map((url) => (
            <Image key={url} source={{ uri: url }} className="mr-2 h-48 w-80 rounded-xl" />
          ))}
        </ScrollView>
      ) : (
        <View className="h-48 items-center justify-center rounded-xl bg-muted">
          <Text className="text-4xl">🔌</Text>
        </View>
      )}

      <View className="gap-1">
        <Text className="text-xl font-bold">{charger.address}</Text>
        <Text className="text-base text-muted-foreground">
          {t('charger.perHour', { rate: charger.hourlyRate })} · {t('charger.powerKw', { power: charger.powerKw })}
        </Text>
        <Text className="text-sm text-muted-foreground">{charger.connectorTypes.join(', ')}</Text>
        {available ? (
          <View className="mt-1 self-start rounded-full bg-brand-light px-3 py-1">
            <Text className="text-xs font-medium text-brand-dark">{t('home.filters.availableNow')}</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3 rounded-xl border border-border p-3">
        {host?.photoUrl ? (
          <Image source={{ uri: host.photoUrl }} className="h-10 w-10 rounded-full" />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Text>👤</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="font-medium">{t('charger.hostedBy', { name: host?.name ?? '…' })}</Text>
          {host?.isHostVerified ? (
            <Text className="text-xs text-brand-dark">{t('charger.verifiedHost')}</Text>
          ) : null}
        </View>
        {!isOwnCharger ? (
          <Pressable onPress={() => setReportVisible(true)}>
            <Text className="text-xs text-muted-foreground">{t('profile.reportUser')}</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="text-xs text-muted-foreground">
        {t('host.minSessionCharge')}: {formatInr(charger.minSessionCharge)}
      </Text>

      <AvailabilitySummary schedule={charger.availabilitySchedule} />

      {!isOwnCharger ? (
        <Button label={t('charger.requestToBook')} onPress={() => router.push(`/booking/new?chargerId=${charger.id}`)} />
      ) : (
        <View className="gap-3">
          <Button label={t('host.editListing')} variant="secondary" onPress={() => router.push(`/charger/${charger.id}/edit`)} />

          <View className="gap-2">
            <Text className="text-sm font-medium">{t('host.upcomingBookings')}</Text>
            {upcomingBookings && upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <Pressable
                  key={booking.id}
                  onPress={() => router.push(`/booking/${booking.id}`)}
                  className="rounded-xl border border-border p-3"
                >
                  <Text className="text-sm">{new Date(booking.requestedStart).toLocaleString()}</Text>
                  <Text className="text-xs text-muted-foreground">{formatInr(booking.estimatedCost)}</Text>
                </Pressable>
              ))
            ) : (
              <Text className="text-sm text-muted-foreground">{t('notifications.empty')}</Text>
            )}
          </View>
        </View>
      )}

      <ReportUserModal visible={reportVisible} onClose={() => setReportVisible(false)} reportedUser={charger.hostId} />
    </Screen>
  );
}
