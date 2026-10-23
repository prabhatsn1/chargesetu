import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { GST_RATE } from '@/config/constants';
import { formatInr } from '@/features/payments/money';
import { useSession } from '@/features/sessions/hooks';
import { createRazorpayOrderFn } from '@/services/functions';
import { openRazorpayCheckout } from '@/services/razorpay';
import { useAuthStore } from '@/store/authStore';

export default function PaymentScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session, isLoading, isError, refetch } = useSession(id ?? null);
  const profile = useAuthStore((s) => s.profile);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isError) {
    return (
      <Screen>
        <ErrorView onRetry={refetch} />
      </Screen>
    );
  }

  if (isLoading || !session) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color="#16A34A" />
      </Screen>
    );
  }

  if (session.paymentStatus === 'paid') {
    return (
      <Screen className="items-center justify-center gap-4">
        <Text className="text-xl font-semibold">{formatInr(session.totalAmount ?? 0)}</Text>
        <Text className="text-muted-foreground">{t('payment.title')} ✓</Text>
        <Button label={t('common.done')} onPress={() => router.replace(`/review/${session.id}`)} />
      </Screen>
    );
  }

  async function handlePay() {
    if (!session || !profile) return;
    setIsPaying(true);
    setError(null);
    try {
      const { data: order } = await createRazorpayOrderFn({ sessionId: session.id });
      await openRazorpayCheckout({
        order,
        sessionId: session.id,
        userName: profile.name,
        userEmail: profile.email,
        userPhone: profile.phone,
      });
      // Firestore paymentStatus flips once the webhook processes payment.captured —
      // useSession() polls, so this screen updates itself without extra code here.
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error.generic'));
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <Screen className="items-center justify-center gap-4">
      <Text className="text-sm text-muted-foreground">{t('payment.title')}</Text>
      <Text className="text-3xl font-bold">{formatInr(session.totalAmount ?? 0)}</Text>
      <View className="gap-1 rounded-xl bg-muted p-3">
        <Text className="text-xs text-muted-foreground">
          {t('payment.gstNotice', { rate: Math.round(GST_RATE * 100) })}
        </Text>
      </View>
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      <Button label={t('payment.payNow')} loading={isPaying} onPress={handlePay} />
    </Screen>
  );
}
