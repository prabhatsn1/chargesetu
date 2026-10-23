import { onAuthStateChanged } from '@react-native-firebase/auth';
import { useEffect } from 'react';

import { createUserProfileIfMissing, updateUserProfile } from '@/features/auth/profile';
import { auth } from '@/services/firebase';
import { registerForPushNotificationsAsync, subscribeToForegroundNotifications } from '@/services/notifications';
import { useAuthStore } from '@/store/authStore';

/** Mounted once at the app root — keeps the auth store in sync with Firebase Auth + the Firestore profile. */
export function useAuthListener() {
  const setFirebaseUid = useAuthStore((s) => s.setFirebaseUid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitializing = useAuthStore((s) => s.setInitializing);
  const signOutLocal = useAuthStore((s) => s.signOutLocal);

  useEffect(() => subscribeToForegroundNotifications(), []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        signOutLocal();
        setInitializing(false);
        return;
      }

      setFirebaseUid(firebaseUser.uid);
      const profile = await createUserProfileIfMissing(firebaseUser);
      setProfile(profile);
      setInitializing(false);

      void registerForPushNotificationsAsync().then((token) => {
        if (token) void updateUserProfile(firebaseUser.uid, { fcmToken: token });
      });
    });

    return unsubscribe;
  }, [setFirebaseUid, setProfile, setInitializing, signOutLocal]);
}
