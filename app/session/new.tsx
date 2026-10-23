import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { LoadingView } from '@/components/LoadingView';
import { useBooking } from '@/features/bookings/hooks';
import { useCharger } from '@/features/chargers/hooks';
import { createSessionIfMissing } from '@/features/sessions/api';

/**
 * A booking has at most one session, so the session doc reuses the booking's
 * id — re-entering this screen for the same booking is a no-op, not a duplicate.
 */
export default function NewSessionScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { data: booking } = useBooking(bookingId ?? null);
  const { data: charger } = useCharger(booking?.chargerId ?? null);

  useEffect(() => {
    if (!booking || !charger) return;
    (async () => {
      await createSessionIfMissing({
        id: booking.id,
        bookingId: booking.id,
        chargerId: booking.chargerId,
        hostId: booking.hostId,
        chargeeId: booking.chargeeId,
        hourlyRateAtBooking: charger.hourlyRate,
      });
      router.replace(`/session/${booking.id}`);
    })();
  }, [booking, charger]);

  return <LoadingView />;
}
