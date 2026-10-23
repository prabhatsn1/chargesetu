import { signInWithPhoneNumber } from '@react-native-firebase/auth';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { mapAuthErrorMessage } from '@/features/auth/errors';
import { toE164India } from '@/features/auth/phone';
import { auth } from '@/services/firebase';
import { usePhoneAuthStore } from '@/store/phoneAuthStore';

export function usePhoneAuth() {
  const { t } = useTranslation();
  const { confirmation, setPending, clear } = usePhoneAuthStore();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(rawPhone: string) {
    const phone = toE164India(rawPhone);
    if (!phone) {
      setError(t('auth.errors.invalidPhone'));
      return false;
    }
    setIsSending(true);
    setError(null);
    try {
      const result = await signInWithPhoneNumber(auth, phone);
      setPending(phone, result);
      return true;
    } catch (e) {
      setError(mapAuthErrorMessage(e, t));
      return false;
    } finally {
      setIsSending(false);
    }
  }

  async function confirmOtp(code: string) {
    if (!confirmation) {
      setError(t('common.error.generic'));
      return false;
    }
    setIsSending(true);
    setError(null);
    try {
      await confirmation.confirm(code);
      clear();
      return true;
    } catch (e) {
      setError(mapAuthErrorMessage(e, t));
      return false;
    } finally {
      setIsSending(false);
    }
  }

  return { sendOtp, confirmOtp, isSending, error, hasSentOtp: confirmation !== null };
}
