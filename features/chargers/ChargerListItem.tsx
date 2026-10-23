import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

import { isAvailableNow } from '@/features/chargers/availability';
import type { Charger } from '@/types';

interface ChargerListItemProps {
  charger: Charger;
  distanceKm: number | null;
}

export function ChargerListItem({ charger, distanceKm }: ChargerListItemProps) {
  const { t } = useTranslation();
  const available = isAvailableNow(charger.availabilitySchedule);

  return (
    <Pressable
      onPress={() => router.push(`/charger/${charger.id}`)}
      className="flex-row gap-3 rounded-xl border border-border p-3"
    >
      {charger.photos[0] ? (
        <Image source={{ uri: charger.photos[0] }} className="h-20 w-20 rounded-lg" />
      ) : (
        <View className="h-20 w-20 items-center justify-center rounded-lg bg-muted">
          <Text className="text-2xl">🔌</Text>
        </View>
      )}
      <View className="flex-1 justify-center gap-1">
        <Text className="font-semibold" numberOfLines={1}>
          {charger.address}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {t('charger.perHour', { rate: charger.hourlyRate })} · {t('charger.powerKw', { power: charger.powerKw })}
        </Text>
        <Text className="text-xs text-muted-foreground">
          {charger.connectorTypes.join(', ')}
          {distanceKm !== null ? ` · ${distanceKm.toFixed(1)} km` : ''}
        </Text>
      </View>
      {available ? (
        <View className="self-start rounded-full bg-brand-light px-2 py-1">
          <Text className="text-xs font-medium text-brand-dark">{t('home.filters.availableNow')}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
