import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import './admin';
import { sendPushToUser } from './notify';

const AUTO_CONFIRM_WINDOW_MS = 24 * 60 * 60 * 1000;

export const onSessionEnded = onDocumentUpdated('sessions/{sessionId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  // Fires exactly once, the moment endedAt transitions from unset to set.
  if (before.endedAt || !after.endedAt) return;

  await sendPushToUser(after.hostId, 'Review a completed session', 'Confirm the reported charging session.', {
    kind: 'session_confirmation_needed',
    sessionId: event.params.sessionId,
  });
});

/** Runs hourly — auto-confirms any session the Host hasn't reviewed within the grace window (§5.3.5). */
export const autoConfirmStaleSessions = onSchedule('every 60 minutes', async () => {
  const cutoff = Date.now() - AUTO_CONFIRM_WINDOW_MS;
  const snapshot = await getFirestore()
    .collection('sessions')
    .where('hostConfirmationStatus', '==', null)
    .where('endedAt', '<=', cutoff)
    .get();

  await Promise.all(snapshot.docs.map((doc) => doc.ref.update({ hostConfirmationStatus: 'auto_confirmed' })));
});
