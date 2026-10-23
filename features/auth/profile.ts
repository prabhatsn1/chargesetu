import type { User } from '@react-native-firebase/auth';
import { doc, getDoc, setDoc, updateDoc, type DocumentSnapshot } from '@react-native-firebase/firestore';

import { firestore, usersCollection } from '@/services/firebase';
import type { UserProfile } from '@/types';

export function toUserProfile(snapshot: DocumentSnapshot): UserProfile | null {
  const data = snapshot.data();
  if (!data) return null;

  return {
    uid: snapshot.id,
    name: data.name ?? '',
    phone: data.phone ?? '',
    email: data.email ?? null,
    photoUrl: data.photoUrl ?? null,
    languagePref: data.languagePref ?? 'en',
    isHostVerified: data.isHostVerified ?? false,
    aadhaarLast4: data.aadhaarLast4 ?? null,
    hostVerificationDocUrl: data.hostVerificationDocUrl ?? null,
    hostVerificationStatus: data.hostVerificationStatus ?? 'unverified',
    vehicleModel: data.vehicleModel ?? null,
    vehicleConnectorType: data.vehicleConnectorType ?? null,
    razorpayLinkedAccountId: data.razorpayLinkedAccountId ?? null,
    payoutAccountStatus: data.payoutAccountStatus ?? 'unlinked',
    fcmToken: data.fcmToken ?? null,
    avgRatingAsHost: data.avgRatingAsHost ?? null,
    avgRatingAsChargee: data.avgRatingAsChargee ?? null,
    createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt ?? Date.now()),
  };
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(usersCollection(), uid));
  if (!snapshot.exists()) return null;
  return toUserProfile(snapshot);
}

/** Creates a bare profile doc right after first sign-in; onboarding fills in the rest. */
export async function createUserProfileIfMissing(firebaseUser: User): Promise<UserProfile> {
  const ref = doc(usersCollection(), firebaseUser.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return toUserProfile(existing) as UserProfile;
  }

  const seed = {
    name: firebaseUser.displayName ?? '',
    phone: firebaseUser.phoneNumber ?? '',
    email: firebaseUser.email ?? null,
    photoUrl: firebaseUser.photoURL ?? null,
    languagePref: 'en' as const,
    isHostVerified: false,
    aadhaarLast4: null,
    hostVerificationDocUrl: null,
    hostVerificationStatus: 'unverified' as const,
    vehicleModel: null,
    vehicleConnectorType: null,
    razorpayLinkedAccountId: null,
    payoutAccountStatus: 'unlinked' as const,
    fcmToken: null,
    avgRatingAsHost: null,
    avgRatingAsChargee: null,
    createdAt: Date.now(),
  };
  await setDoc(ref, seed);
  return { uid: firebaseUser.uid, ...seed };
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), patch);
}
