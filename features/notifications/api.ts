import {
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from '@react-native-firebase/firestore';

import { notificationsCollection } from '@/services/firebase';
import type { AppNotification } from '@/types';

function toNotification(snapshot: QueryDocumentSnapshot<DocumentData>): AppNotification {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    toUid: data.toUid,
    kind: data.kind,
    title: data.title,
    body: data.body,
    bookingId: data.bookingId ?? null,
    sessionId: data.sessionId ?? null,
    read: data.read ?? false,
    createdAt: data.createdAt ?? Date.now(),
  };
}

export async function fetchNotifications(uid: string): Promise<AppNotification[]> {
  const snapshot = await getDocs(
    query(notificationsCollection(), where('toUid', '==', uid), orderBy('createdAt', 'desc')),
  );
  return snapshot.docs.map(toNotification);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(notificationsCollection(), notificationId), { read: true });
}
