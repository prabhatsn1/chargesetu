import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';

import './admin';

export type NotificationKind =
  | 'booking_requested'
  | 'booking_accepted'
  | 'booking_declined'
  | 'session_started'
  | 'session_ended'
  | 'session_confirmation_needed'
  | 'payment_receipt'
  | 'payout_confirmed';

interface NotifyPayload {
  kind: NotificationKind;
  bookingId?: string;
  sessionId?: string;
}

/**
 * Writes an in-app notification doc (for the Notifications center, §5.4) and
 * pushes to the recipient's FCM device token. A missing/stale token only
 * skips the push — the in-app record is written either way.
 */
export async function sendPushToUser(uid: string, title: string, body: string, data: NotifyPayload): Promise<void> {
  await getFirestore()
    .collection('notifications')
    .add({
      toUid: uid,
      kind: data.kind,
      title,
      body,
      bookingId: data.bookingId ?? null,
      sessionId: data.sessionId ?? null,
      read: false,
      createdAt: Date.now(),
    });

  const userDoc = await getFirestore().collection('users').doc(uid).get();
  const fcmToken = userDoc.data()?.fcmToken as string | undefined;
  if (!fcmToken) {
    logger.warn(`No fcmToken for user ${uid}, skipping push: ${title}`);
    return;
  }

  const stringData: Record<string, string> = { kind: data.kind };
  if (data.bookingId) stringData.bookingId = data.bookingId;
  if (data.sessionId) stringData.sessionId = data.sessionId;

  try {
    await getMessaging().send({
      token: fcmToken,
      notification: { title, body },
      data: stringData,
    });
  } catch (error) {
    logger.error(`Failed to send push to ${uid}`, error);
  }
}
