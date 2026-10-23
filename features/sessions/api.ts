import {
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from '@react-native-firebase/firestore';

import { computeSessionCost } from '@/features/payments/money';
import { sessionsCollection } from '@/services/firebase';
import type { Session } from '@/types';

function toSession(snapshot: DocumentSnapshot | QueryDocumentSnapshot<DocumentData>): Session | null {
  const data = snapshot.data();
  if (!data) return null;
  return {
    id: snapshot.id,
    bookingId: data.bookingId,
    chargerId: data.chargerId,
    hostId: data.hostId,
    chargeeId: data.chargeeId,
    startedAt: data.startedAt ?? null,
    endedAt: data.endedAt ?? null,
    startPhotoUrl: data.startPhotoUrl ?? null,
    endPhotoUrl: data.endPhotoUrl ?? null,
    durationMinutes: data.durationMinutes ?? null,
    hourlyRateAtBooking: data.hourlyRateAtBooking,
    totalAmount: data.totalAmount ?? null,
    commissionAmount: data.commissionAmount ?? null,
    gstAmount: data.gstAmount ?? null,
    hostPayoutAmount: data.hostPayoutAmount ?? null,
    paymentStatus: data.paymentStatus ?? 'pending',
    razorpayOrderId: data.razorpayOrderId ?? null,
    razorpayPaymentId: data.razorpayPaymentId ?? null,
    hostConfirmationStatus: data.hostConfirmationStatus ?? null,
    createdAt: data.createdAt ?? Date.now(),
  };
}

export interface CreateSessionInput {
  id: string;
  bookingId: string;
  chargerId: string;
  hostId: string;
  chargeeId: string;
  hourlyRateAtBooking: number;
}

/** Idempotent — re-navigating to an in-progress session must not create a duplicate. */
export async function createSessionIfMissing(input: CreateSessionInput): Promise<void> {
  const ref = doc(sessionsCollection(), input.id);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  await setDoc(ref, {
    bookingId: input.bookingId,
    chargerId: input.chargerId,
    hostId: input.hostId,
    chargeeId: input.chargeeId,
    startedAt: null,
    endedAt: null,
    startPhotoUrl: null,
    endPhotoUrl: null,
    durationMinutes: null,
    hourlyRateAtBooking: input.hourlyRateAtBooking,
    totalAmount: null,
    commissionAmount: null,
    gstAmount: null,
    hostPayoutAmount: null,
    paymentStatus: 'pending',
    razorpayOrderId: null,
    razorpayPaymentId: null,
    hostConfirmationStatus: null,
    createdAt: Date.now(),
  });
}

export async function fetchSessionById(sessionId: string): Promise<Session | null> {
  const snapshot = await getDoc(doc(sessionsCollection(), sessionId));
  return toSession(snapshot);
}

export async function fetchSessionsForHost(hostId: string): Promise<Session[]> {
  const snapshot = await getDocs(
    query(sessionsCollection(), where('hostId', '==', hostId), orderBy('createdAt', 'desc')),
  );
  return snapshot.docs.map(toSession).filter((s): s is Session => s !== null);
}

export async function setSessionHostConfirmation(
  sessionId: string,
  status: 'confirmed' | 'disputed',
): Promise<void> {
  await updateDoc(doc(sessionsCollection(), sessionId), { hostConfirmationStatus: status });
}

export async function startSession(sessionId: string, startPhotoUrl: string): Promise<void> {
  await updateDoc(doc(sessionsCollection(), sessionId), {
    startedAt: Date.now(),
    startPhotoUrl,
  });
}

interface EndSessionInput {
  sessionId: string;
  endPhotoUrl: string;
  startedAt: number;
  hourlyRateAtBooking: number;
  minSessionCharge: number;
}

export async function endSession(input: EndSessionInput): Promise<void> {
  const endedAt = Date.now();
  const durationMinutes = Math.max(1, Math.round((endedAt - input.startedAt) / 60_000));
  const { totalAmount, commissionAmount, gstAmount, hostPayoutAmount } = computeSessionCost(
    input.hourlyRateAtBooking,
    durationMinutes,
    input.minSessionCharge,
  );

  await updateDoc(doc(sessionsCollection(), input.sessionId), {
    endedAt,
    endPhotoUrl: input.endPhotoUrl,
    durationMinutes,
    totalAmount,
    commissionAmount,
    gstAmount,
    hostPayoutAmount,
  });
}
