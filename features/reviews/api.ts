import { addDoc, getDocs, query, where } from '@react-native-firebase/firestore';

import { reviewsCollection } from '@/services/firebase';
import type { ReviewDirection } from '@/types';

export interface CreateReviewInput {
  sessionId: string;
  fromUid: string;
  toUid: string;
  rating: number;
  comment: string | null;
  direction: ReviewDirection;
}

export async function createReview(input: CreateReviewInput): Promise<void> {
  await addDoc(reviewsCollection(), { ...input, createdAt: Date.now() });
}

/** Used to show "already reviewed" instead of letting a Chargee/Host submit twice for the same session. */
export async function hasReviewed(sessionId: string, fromUid: string): Promise<boolean> {
  const snapshot = await getDocs(
    query(reviewsCollection(), where('sessionId', '==', sessionId), where('fromUid', '==', fromUid)),
  );
  return !snapshot.empty;
}
