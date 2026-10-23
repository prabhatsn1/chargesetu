import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ConnectorTypePicker } from '@/features/chargers/ConnectorTypePicker';
import { useChargerFilterStore } from '@/store/vehicleFilterStore';

const DISTANCE_PRESETS_KM = [2, 5, 10, 20, 50];

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const { t } = useTranslation();
  const filters = useChargerFilterStore();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/30">
        <View className="max-h-[80%] rounded-t-2xl bg-surface p-4">
          <ScrollView contentContainerClassName="gap-5 pb-4">
            <View className="gap-2">
              <Text className="text-sm font-medium">{t('home.filters.connectorType')}</Text>
              <ConnectorTypePicker
                value={filters.connectorType ? [filters.connectorType] : []}
                onChange={(next) => filters.setConnectorType(next[next.length - 1] ?? null)}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">{t('home.filters.maxDistance')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {DISTANCE_PRESETS_KM.map((km) => {
                  const selected = filters.maxDistanceKm === km;
                  return (
                    <Pressable
                      key={km}
                      onPress={() => filters.setMaxDistanceKm(km)}
                      className={`rounded-full border px-3 py-2 ${selected ? 'border-brand bg-brand-light' : 'border-border'}`}
                    >
                      <Text className={selected ? 'text-brand-dark font-medium' : 'text-black'}>{km} km</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">{t('home.filters.priceRange')}</Text>
              <TextField
                placeholder={t('home.filters.priceRangePlaceholder')}
                keyboardType="numeric"
                value={filters.maxPricePerHour !== null ? String(filters.maxPricePerHour) : ''}
                onChangeText={(text) => filters.setMaxPricePerHour(text ? Number(text) : null)}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium">{t('home.filters.availableNow')}</Text>
              <Switch value={filters.availableNowOnly} onValueChange={filters.setAvailableNowOnly} />
            </View>
          </ScrollView>

          <Button label={t('common.done')} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
