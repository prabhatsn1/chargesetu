import '@/global.css';
import '@/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthListener } from '@/features/auth/useAuthListener';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  useAuthListener();
  const { t } = useTranslation();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="charger/[id]" options={{ headerShown: true, title: t('nav.charger') }} />
            <Stack.Screen name="charger/new" options={{ headerShown: true, title: t('host.listChargerWizard') }} />
            <Stack.Screen name="booking/[id]" options={{ headerShown: true, title: t('nav.booking') }} />
            <Stack.Screen name="session/[id]" options={{ headerShown: true, title: t('nav.session') }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
