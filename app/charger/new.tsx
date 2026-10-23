import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { ChargerForm, type ChargerFormValues } from '@/features/chargers/ChargerForm';
import { useCreateCharger } from '@/features/chargers/hooks';
import { useAuthStore } from '@/store/authStore';

export default function NewChargerScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const createCharger = useCreateCharger();

  async function onSubmit(values: ChargerFormValues) {
    if (!profile?.uid) return;
    const chargerId = await createCharger.mutateAsync({ hostId: profile.uid, ...values });
    router.replace(`/charger/${chargerId}`);
  }

  return (
    <Screen scroll className="pt-4">
      <ChargerForm
        uploadPathPrefix={`chargers/pending/${profile?.uid ?? 'anon'}`}
        submitLabel={t('common.save')}
        isSubmitting={createCharger.isPending}
        onSubmit={onSubmit}
      />
    </Screen>
  );
}
