import { AppleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { mapAuthErrorMessage } from '@/features/auth/errors';
import { auth } from '@/services/firebase';

export function useAppleSignIn() {
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = Platform.OS === 'ios';

  async function signInWithApple() {
    setIsSigningIn(true);
    setError(null);
    try {
      const response = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!response.identityToken) throw new Error('Apple sign-in did not return an identity token');

      const credential = AppleAuthProvider.credential(response.identityToken);
      await signInWithCredential(auth, credential);
    } catch (e) {
      setError(mapAuthErrorMessage(e, t));
    } finally {
      setIsSigningIn(false);
    }
  }

  return { signInWithApple, isSigningIn, error, isAvailable };
}
