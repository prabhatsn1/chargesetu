import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { ChargerForm, type ChargerFormValues } from '@/features/chargers/ChargerForm';
import { useCharger, useUpdateCharger } from '@/features/chargers/hooks';
import { useAuthStore } from '@/store/authStore';

export default function EditChargerScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: charger, isLoading, isError, refetch } = useCharger(id ?? null);
  const hostId = useAuthStore((s) => s.firebaseUid) ?? '';
  const updateCharger = useUpdateCharger(hostId);

  if (isError) {
    return (
      <Screen>
        <ErrorView onRetry={refetch} />
      </Screen>
    );
  }

  if (isLoading || !charger) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color="#16A34A" />
      </Screen>
    );
  }

  async function onSubmit(values: ChargerFormValues) {
    await updateCharger.mutateAsync({ chargerId: charger!.id, patch: values });
    router.replace(`/charger/${charger!.id}`);
  }

  return (
    <Screen scroll className="pt-4">
      <ChargerForm
        initialValues={charger}
        uploadPathPrefix={`chargers/${charger.id}`}
        submitLabel={t('common.save')}
        isSubmitting={updateCharger.isPending}
        onSubmit={onSubmit}
      />
    </Screen>
  );
}
