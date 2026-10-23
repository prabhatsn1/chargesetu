import { GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { mapAuthErrorMessage } from '@/features/auth/errors';
import { auth } from '@/services/firebase';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_SIGNIN_WEB_CLIENT_ID,
});

export function useGoogleSignIn() {
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsSigningIn(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return;

      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google sign-in did not return an ID token');

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (e) {
      setError(mapAuthErrorMessage(e, t));
    } finally {
      setIsSigningIn(false);
    }
  }

  return { signInWithGoogle, isSigningIn, error };
}
