import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { isAvailableNow } from '@/features/chargers/availability';
import { ChargerListItem } from '@/features/chargers/ChargerListItem';
import { haversineKm } from '@/features/chargers/distance';
import { FilterSheet } from '@/features/chargers/FilterSheet';
import { useActiveChargers } from '@/features/chargers/useNearbyChargers';
import { useCurrentLocation } from '@/features/location/useCurrentLocation';
import { useAuthStore } from '@/store/authStore';
import { useChargerFilterStore } from '@/store/vehicleFilterStore';
import type { Charger } from '@/types';

type ViewMode = 'map' | 'list';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { coords } = useCurrentLocation();
  const { data: chargers, isLoading, isError, refetch } = useActiveChargers();
  const filters = useChargerFilterStore();
  const savedVehicleConnector = useAuthStore((s) => s.profile?.vehicleConnectorType ?? null);

  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Prefill the connector filter from the Chargee's saved vehicle (§5.4) — only once,
  // so it doesn't stomp on a filter the user has since changed themselves.
  useEffect(() => {
    if (savedVehicleConnector && filters.connectorType === null) {
      filters.setConnectorType(savedVehicleConnector);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedVehicleConnector]);

  const filtered = useMemo(() => {
    if (!chargers) return [];
    return chargers
      .map((charger) => ({
        charger,
        distanceKm: coords ? haversineKm(coords, charger.location) : null,
      }))
      .filter(({ charger, distanceKm }) => {
        if (filters.connectorType && !charger.connectorTypes.includes(filters.connectorType)) return false;
        if (filters.maxPricePerHour && charger.hourlyRate > filters.maxPricePerHour) return false;
        if (filters.availableNowOnly && !isAvailableNow(charger.availabilitySchedule)) return false;
        if (distanceKm !== null && distanceKm > filters.maxDistanceKm) return false;
        return true;
      })
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [chargers, coords, filters]);

  return (
    <Screen className="gap-3 pt-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold">{t('home.title')}</Text>
        <View className="flex-row gap-2">
          <Pressable onPress={() => router.push('/notifications')} className="rounded-full bg-muted px-3 py-2">
            <Text className="text-sm font-medium">🔔</Text>
          </Pressable>
          <Pressable onPress={() => setFiltersVisible(true)} className="rounded-full bg-muted px-3 py-2">
            <Text className="text-sm font-medium">{t('home.filtersButton')} ⚙️</Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            className="rounded-full bg-muted px-3 py-2"
          >
            <Text className="text-sm font-medium">{viewMode === 'map' ? t('home.listView') : t('home.mapView')}</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#16A34A" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('home.empty')} />
      ) : viewMode === 'map' ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1, borderRadius: 12 }}
          initialRegion={{
            latitude: coords?.latitude ?? filtered[0].charger.location.latitude,
            longitude: coords?.longitude ?? filtered[0].charger.location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {filtered.map(({ charger }: { charger: Charger }) => (
            <Marker
              key={charger.id}
              coordinate={charger.location}
              title={charger.address}
              description={t('charger.perHour', { rate: charger.hourlyRate })}
              onCalloutPress={() => router.push(`/charger/${charger.id}`)}
            />
          ))}
        </MapView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={({ charger }) => charger.id}
          contentContainerClassName="gap-3 pb-4"
          renderItem={({ item }) => <ChargerListItem charger={item.charger} distanceKm={item.distanceKm} />}
        />
      )}

      <FilterSheet visible={filtersVisible} onClose={() => setFiltersVisible(false)} />
    </Screen>
  );
}
