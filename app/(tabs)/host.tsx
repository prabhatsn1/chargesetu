import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { useHostChargers, useSetChargerPaused } from '@/features/chargers/hooks';
import { useAuthStore } from '@/store/authStore';
import type { Charger } from '@/types';

function ChargerCard({ charger }: { charger: Charger }) {
  const { t } = useTranslation();
  const setPaused = useSetChargerPaused(charger.hostId);

  return (
    <Pressable
      onPress={() => router.push(`/charger/${charger.id}`)}
      className="flex-row gap-3 rounded-xl border border-border p-3"
    >
      {charger.photos[0] ? (
        <Image source={{ uri: charger.photos[0] }} className="h-16 w-16 rounded-lg" />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <Text className="text-2xl">🔌</Text>
        </View>
      )}
      <View className="flex-1 justify-center gap-1">
        <Text className="font-semibold" numberOfLines={1}>
          {charger.address}
        </Text>
        <Text className="text-sm text-muted-foreground">{t('charger.perHour', { rate: charger.hourlyRate })}</Text>
      </View>
      <View className="justify-center">
        <Switch
          value={!charger.isPaused}
          onValueChange={(next) => setPaused.mutate({ chargerId: charger.id, isPaused: !next })}
        />
      </View>
    </Pressable>
  );
}

export default function HostScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const { data: chargers, isLoading, isError, refetch } = useHostChargers(profile?.uid ?? null);

  return (
    <Screen scroll className="gap-4 pt-4">
      <Text className="text-xl font-bold">{t('host.myCharger')}</Text>

      <View className="flex-row gap-3">
        <Pressable onPress={() => router.push('/host/requests')} className="flex-1 rounded-xl bg-muted p-3">
          <Text className="font-medium">{t('host.incomingRequests')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/host/earnings')} className="flex-1 rounded-xl bg-muted p-3">
          <Text className="font-medium">{t('host.earnings')}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#16A34A" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : chargers && chargers.length > 0 ? (
        <View className="gap-3">
          {chargers.map((charger) => (
            <ChargerCard key={charger.id} charger={charger} />
          ))}
        </View>
      ) : (
        <EmptyState title={t('home.empty')} />
      )}

      <Button label={t('host.listChargerWizard')} onPress={() => router.push('/charger/new')} />
    </Screen>
  );
}
