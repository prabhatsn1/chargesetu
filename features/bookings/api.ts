import {
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from '@react-native-firebase/firestore';

import { bookingsCollection } from '@/services/firebase';
import type { Booking, BookingStatus } from '@/types';

export interface CreateBookingInput {
  chargerId: string;
  hostId: string;
  chargeeId: string;
  requestedStart: number;
  requestedEnd: number;
  estimatedCost: number;
}

function toBooking(snapshot: QueryDocumentSnapshot<DocumentData>): Booking {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    chargerId: data.chargerId,
    hostId: data.hostId,
    chargeeId: data.chargeeId,
    requestedStart: data.requestedStart,
    requestedEnd: data.requestedEnd,
    status: data.status,
    estimatedCost: data.estimatedCost,
    createdAt: data.createdAt ?? Date.now(),
  };
}

export async function createBooking(input: CreateBookingInput): Promise<string> {
  const ref = await addDoc(bookingsCollection(), {
    ...input,
    status: 'pending' as BookingStatus,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function fetchBookingById(bookingId: string): Promise<Booking | null> {
  const snapshot = await getDoc(doc(bookingsCollection(), bookingId));
  if (!snapshot.exists()) return null;
  return toBooking(snapshot);
}

export async function fetchBookingsForChargee(chargeeId: string): Promise<Booking[]> {
  const snapshot = await getDocs(query(bookingsCollection(), where('chargeeId', '==', chargeeId)));
  return snapshot.docs.map(toBooking).sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchPendingBookingsForHost(hostId: string): Promise<Booking[]> {
  const snapshot = await getDocs(
    query(bookingsCollection(), where('hostId', '==', hostId), where('status', '==', 'pending')),
  );
  return snapshot.docs.map(toBooking).sort((a, b) => b.createdAt - a.createdAt);
}

export async function setBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  await updateDoc(doc(bookingsCollection(), bookingId), { status });
}

export async function fetchUpcomingBookingsForCharger(chargerId: string): Promise<Booking[]> {
  const snapshot = await getDocs(
    query(bookingsCollection(), where('chargerId', '==', chargerId), where('status', '==', 'accepted')),
  );
  return snapshot.docs.map(toBooking).sort((a, b) => a.requestedStart - b.requestedStart);
}
