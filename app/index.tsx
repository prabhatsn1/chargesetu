import { Redirect } from 'expo-router';

import { LoadingView } from '@/components/LoadingView';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const profile = useAuthStore((s) => s.profile);

  if (isInitializing) return <LoadingView />;
  if (!firebaseUid) return <Redirect href="/(auth)" />;
  if (!profile?.name) return <Redirect href="/(auth)/profile-setup" />;
  return <Redirect href="/(tabs)" />;
}
