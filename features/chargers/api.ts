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

import { chargersCollection } from '@/services/firebase';
import type { AvailabilitySchedule, Charger, ConnectorType } from '@/types';

export interface CreateChargerInput {
  hostId: string;
  location: { latitude: number; longitude: number };
  address: string;
  connectorTypes: ConnectorType[];
  powerKw: number;
  hourlyRate: number;
  minSessionCharge: number;
  photos: string[];
  availabilitySchedule: AvailabilitySchedule;
}

function toCharger(snapshot: QueryDocumentSnapshot<DocumentData>): Charger {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    hostId: data.hostId,
    location: data.location,
    address: data.address,
    connectorTypes: data.connectorTypes ?? [],
    powerKw: data.powerKw,
    hourlyRate: data.hourlyRate,
    minSessionCharge: data.minSessionCharge,
    photos: data.photos ?? [],
    availabilitySchedule: data.availabilitySchedule ?? { weekly: [], blockedDates: [] },
    isPaused: data.isPaused ?? false,
    createdAt: data.createdAt ?? Date.now(),
    updatedAt: data.updatedAt ?? Date.now(),
  };
}

export async function createCharger(input: CreateChargerInput): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(chargersCollection(), {
    ...input,
    isPaused: false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateCharger(chargerId: string, patch: Partial<Charger>): Promise<void> {
  await updateDoc(doc(chargersCollection(), chargerId), { ...patch, updatedAt: Date.now() });
}

export async function setChargerPaused(chargerId: string, isPaused: boolean): Promise<void> {
  await updateCharger(chargerId, { isPaused });
}

export async function fetchChargerById(chargerId: string): Promise<Charger | null> {
  const snapshot = await getDoc(doc(chargersCollection(), chargerId));
  if (!snapshot.exists()) return null;
  return toCharger(snapshot);
}

export async function fetchChargersByHost(hostId: string): Promise<Charger[]> {
  const snapshot = await getDocs(query(chargersCollection(), where('hostId', '==', hostId)));
  return snapshot.docs.map(toCharger);
}

export { toCharger };
