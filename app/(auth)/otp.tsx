import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { usePhoneAuth } from '@/features/auth/usePhoneAuth';
import { formatPhoneForDisplay } from '@/features/auth/phone';
import { usePhoneAuthStore } from '@/store/phoneAuthStore';

export default function OtpScreen() {
  const { t } = useTranslation();
  const { confirmOtp, isSending, error } = usePhoneAuth();
  const pendingPhone = usePhoneAuthStore((s) => s.phone);
  const [code, setCode] = useState('');

  async function onSubmit() {
    const ok = await confirmOtp(code);
    if (ok) router.replace('/');
  }

  return (
    <Screen className="justify-center gap-6">
      <View className="items-center gap-1">
        <Text className="text-xl font-bold">
          {t('auth.otpTitle', { phone: pendingPhone ? formatPhoneForDisplay(pendingPhone) : '' })}
        </Text>
      </View>

      <TextField
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        error={error ?? undefined}
      />

      <Button label={t('auth.verifyOtp')} loading={isSending} disabled={code.length !== 6} onPress={onSubmit} />
    </Screen>
  );
}
