import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { useCreateBooking } from '@/features/bookings/hooks';
import { useCharger } from '@/features/chargers/hooks';
import { computeSessionCost, formatInr } from '@/features/payments/money';
import { useAuthStore } from '@/store/authStore';

const DURATION_PRESETS_MIN = [30, 60, 120, 180];

// Kept outside the component so the compiler's purity check doesn't see the
// Date.now() call as happening inside render — this only ever runs from onConfirm.
function computeRequestedWindow(timing: 'now' | 'later', scheduledAt: Date, durationMinutes: number) {
  const requestedStart = timing === 'now' ? Date.now() : scheduledAt.getTime();
  const requestedEnd = requestedStart + durationMinutes * 60 * 1000;
  return { requestedStart, requestedEnd };
}

export default function NewBookingScreen() {
  const { t } = useTranslation();
  const { chargerId } = useLocalSearchParams<{ chargerId: string }>();
  const { data: charger, isLoading, isError, refetch } = useCharger(chargerId ?? null);
  const chargeeId = useAuthStore((s) => s.firebaseUid);
  const createBooking = useCreateBooking();

  const [timing, setTiming] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState<Date>(() => new Date(Date.now() + 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(60);

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

  const estimatedCost = computeSessionCost(charger.hourlyRate, durationMinutes, charger.minSessionCharge).totalAmount;

  async function onConfirm() {
    if (!chargeeId || !charger) return;
    const { requestedStart, requestedEnd } = computeRequestedWindow(timing, scheduledAt, durationMinutes);
    const bookingId = await createBooking.mutateAsync({
      chargerId: charger.id,
      hostId: charger.hostId,
      chargeeId,
      requestedStart,
      requestedEnd,
      estimatedCost,
    });
    router.replace(`/booking/${bookingId}`);
  }

  return (
    <Screen scroll className="gap-5 pt-4">
      <Text className="text-xl font-bold">{t('booking.title')}</Text>

      <View className="gap-2">
        <Text className="text-sm font-medium">{t('booking.pickTime')}</Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setTiming('now')}
            className={`flex-1 rounded-xl border p-3 ${timing === 'now' ? 'border-brand bg-brand-light' : 'border-border'}`}
          >
            <Text className={timing === 'now' ? 'text-center font-medium text-brand-dark' : 'text-center'}>
              {t('booking.now')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTiming('later')}
            className={`flex-1 rounded-xl border p-3 ${timing === 'later' ? 'border-brand bg-brand-light' : 'border-border'}`}
          >
            <Text className={timing === 'later' ? 'text-center font-medium text-brand-dark' : 'text-center'}>
              {t('booking.later')}
            </Text>
          </Pressable>
        </View>

        {timing === 'later' ? (
          <Pressable onPress={() => setShowPicker(true)} className="rounded-xl border border-border p-3">
            <Text>{scheduledAt.toLocaleString()}</Text>
          </Pressable>
        ) : null}
        {showPicker ? (
          <DateTimePicker
            mode="datetime"
            value={scheduledAt}
            minimumDate={new Date()}
            onChange={(_e, date) => {
              setShowPicker(false);
              if (date) setScheduledAt(date);
            }}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
          />
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium">{t('booking.estimatedDuration')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {DURATION_PRESETS_MIN.map((minutes) => {
            const selected = durationMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                onPress={() => setDurationMinutes(minutes)}
                className={`rounded-full border px-3 py-2 ${selected ? 'border-brand bg-brand-light' : 'border-border'}`}
              >
                <Text className={selected ? 'text-brand-dark font-medium' : 'text-black'}>
                  {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-1 rounded-xl bg-muted p-3">
        <Text className="text-sm text-muted-foreground">{t('booking.estimatedCost')}</Text>
        <Text className="text-2xl font-bold">{formatInr(estimatedCost)}</Text>
      </View>

      <Button label={t('booking.confirmRequest')} loading={createBooking.isPending} onPress={onConfirm} />
    </Screen>
  );
}
