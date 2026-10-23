import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const onReviewCreated = onDocumentCreated('reviews/{reviewId}', async (event) => {
  const review = event.data?.data();
  if (!review) return;

  const field = review.direction === 'host_to_chargee' ? 'avgRatingAsChargee' : 'avgRatingAsHost';

  const firestore = getFirestore();
  const existingSnap = await firestore.collection('reviews').where('toUid', '==', review.toUid).where('direction', '==', review.direction).get();

  const ratings = existingSnap.docs.map((doc) => doc.data().rating as number);
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

  await firestore.collection('users').doc(review.toUid).update({ [field]: average });
});
