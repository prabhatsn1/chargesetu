import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { sendPushToUser } from './notify';

export const onBookingCreated = onDocumentCreated('bookings/{bookingId}', async (event) => {
  const booking = event.data?.data();
  if (!booking) return;

  await sendPushToUser(booking.hostId, 'New booking request', 'A Chargee wants to book your charger.', {
    kind: 'booking_requested',
    bookingId: event.params.bookingId,
  });
});

export const onBookingStatusChanged = onDocumentUpdated('bookings/{bookingId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.status === after.status) return;

  if (after.status === 'accepted') {
    await sendPushToUser(after.chargeeId, 'Booking accepted', 'Your host accepted your booking request.', {
      kind: 'booking_accepted',
      bookingId: event.params.bookingId,
    });
  } else if (after.status === 'declined') {
    await sendPushToUser(after.chargeeId, 'Booking declined', 'Your host declined your booking request.', {
      kind: 'booking_declined',
      bookingId: event.params.bookingId,
    });
  }
});
