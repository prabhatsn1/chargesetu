import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView } from '@/components/ErrorView';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { createReview, hasReviewed } from '@/features/reviews/api';
import { useSession } from '@/features/sessions/hooks';
import { useAuthStore } from '@/store/authStore';

export default function ReviewScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading, isError, refetch } = useSession(id ?? null);
  const currentUid = useAuthStore((s) => s.firebaseUid);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session || !currentUid) return;
    hasReviewed(session.id, currentUid).then((result) => {
      setAlreadyReviewed(result);
      setChecked(true);
    });
  }, [session, currentUid]);

  if (isError) {
    return (
      <Screen>
        <ErrorView onRetry={refetch} />
      </Screen>
    );
  }

  if (isLoading || !session || !checked) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color="#16A34A" />
      </Screen>
    );
  }

  const isHost = currentUid === session.hostId;
  const toUid = isHost ? session.chargeeId : session.hostId;

  if (alreadyReviewed) {
    return (
      <Screen className="items-center justify-center gap-2">
        <Text className="text-lg font-semibold">{t('common.done')}</Text>
        <Button label={t('common.done')} onPress={() => router.replace('/(tabs)')} />
      </Screen>
    );
  }

  async function onSubmit() {
    if (!currentUid || rating === 0) return;
    setIsSubmitting(true);
    try {
      await createReview({
        sessionId: session!.id,
        fromUid: currentUid,
        toUid,
        rating,
        comment: comment.trim() || null,
        direction: isHost ? 'host_to_chargee' : 'chargee_to_host',
      });
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen className="items-center justify-center gap-5 px-6">
      <Text className="text-xl font-bold">{isHost ? t('reviews.rateChargee') : t('reviews.rateHost')}</Text>
      <RatingStars value={rating} onChange={setRating} />
      <TextField
        placeholder={t('reviews.commentOptional')}
        value={comment}
        onChangeText={setComment}
        multiline
        className="w-full"
      />
      <Button label={t('common.confirm')} loading={isSubmitting} disabled={rating === 0} onPress={onSubmit} />
    </Screen>
  );
}
