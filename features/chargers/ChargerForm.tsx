import * as Location from 'expo-location';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { MapPinPicker, type LatLng } from '@/components/MapPinPicker';
import { TextField } from '@/components/TextField';
import { AvailabilityEditor } from '@/features/chargers/AvailabilityEditor';
import { ConnectorTypePicker } from '@/features/chargers/ConnectorTypePicker';
import { PhotoPicker } from '@/features/chargers/PhotoPicker';
import { suggestHourlyRate } from '@/features/chargers/rateCalculator';
import { formatInr } from '@/features/payments/money';
import type { AvailabilitySchedule, ConnectorType } from '@/types';

export interface ChargerFormValues {
  location: LatLng;
  address: string;
  connectorTypes: ConnectorType[];
  powerKw: number;
  hourlyRate: number;
  minSessionCharge: number;
  photos: string[];
  availabilitySchedule: AvailabilitySchedule;
}

export const DEFAULT_AVAILABILITY_SCHEDULE: AvailabilitySchedule = {
  weekly: [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startMinutes: 9 * 60, endMinutes: 21 * 60 })),
  blockedDates: [],
};

interface ChargerFormProps {
  initialValues?: Partial<ChargerFormValues>;
  uploadPathPrefix: string;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: ChargerFormValues) => void;
}

export function ChargerForm({ initialValues, uploadPathPrefix, submitLabel, isSubmitting, onSubmit }: ChargerFormProps) {
  const { t } = useTranslation();

  const [coords, setCoords] = useState<LatLng | null>(initialValues?.location ?? null);
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [connectorTypes, setConnectorTypes] = useState<ConnectorType[]>(initialValues?.connectorTypes ?? []);
  const [powerKw, setPowerKw] = useState(String(initialValues?.powerKw ?? 7));
  const [photos, setPhotos] = useState<string[]>(initialValues?.photos ?? []);
  const [hourlyRate, setHourlyRate] = useState(String(initialValues?.hourlyRate ?? suggestHourlyRate()));
  const [minSessionCharge, setMinSessionCharge] = useState(String(initialValues?.minSessionCharge ?? 50));
  const [schedule, setSchedule] = useState<AvailabilitySchedule>(
    initialValues?.availabilitySchedule ?? DEFAULT_AVAILABILITY_SCHEDULE,
  );

  const suggestedRate = suggestHourlyRate(Number(powerKw) || undefined);

  async function handleCoordsChange(next: LatLng) {
    setCoords(next);
    if (initialValues?.address) return; // editing an existing listing — don't clobber a typed address
    try {
      const [place] = await Location.reverseGeocodeAsync(next);
      if (place) {
        setAddress([place.name, place.street, place.city, place.region].filter(Boolean).join(', '));
      }
    } catch {
      // Reverse geocoding is best-effort — the Host can still type the address manually.
    }
  }

  const canSubmit =
    coords !== null &&
    address.trim().length > 0 &&
    connectorTypes.length > 0 &&
    Number(powerKw) > 0 &&
    Number(hourlyRate) > 0;

  function handleSubmit() {
    if (!coords) return;
    onSubmit({
      location: coords,
      address,
      connectorTypes,
      powerKw: Number(powerKw),
      hourlyRate: Number(hourlyRate),
      minSessionCharge: Number(minSessionCharge) || 0,
      photos,
      availabilitySchedule: schedule,
    });
  }

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text className="text-sm font-medium">{t('host.location')}</Text>
        <MapPinPicker initialCoords={coords ?? undefined} onChange={handleCoordsChange} />
        <TextField value={address} onChangeText={setAddress} placeholder={t('host.location')} />
      </View>

      <View className="gap-2">
        <Text className="text-sm font-medium">{t('host.connectorTypes')}</Text>
        <ConnectorTypePicker value={connectorTypes} onChange={setConnectorTypes} />
      </View>

      <TextField label={t('host.powerRating')} value={powerKw} onChangeText={setPowerKw} keyboardType="numeric" />

      <View className="gap-2">
        <PhotoPicker photos={photos} onChange={setPhotos} uploadPathPrefix={uploadPathPrefix} />
      </View>

      <View className="gap-2">
        <TextField label={t('host.hourlyRate')} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric" />
        <Text className="text-xs text-muted-foreground">
          {t('host.rateCalculatorHint', { margin: 20 })} — {t('host.rateCalculator')}: {formatInr(suggestedRate)}/hr
        </Text>
      </View>

      <TextField
        label={t('host.minSessionCharge')}
        value={minSessionCharge}
        onChangeText={setMinSessionCharge}
        keyboardType="numeric"
      />

      <View className="gap-2">
        <Text className="text-sm font-medium">{t('host.availability')}</Text>
        <AvailabilityEditor value={schedule} onChange={setSchedule} />
      </View>

      <Button label={submitLabel} disabled={!canSubmit} loading={isSubmitting} onPress={handleSubmit} />
    </View>
  );
}
