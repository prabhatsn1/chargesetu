import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { SUPPORTED_LANGUAGES } from '@/config/constants';
import { updateUserProfile } from '@/features/auth/profile';
import { ConnectorTypePicker } from '@/features/chargers/ConnectorTypePicker';
import { captureAndUploadPhoto } from '@/services/cameraUpload';
import { setLanguage } from '@/i18n';
import { createRazorpayLinkedAccountFn } from '@/services/functions';
import { uploadFileAsync } from '@/services/storageUpload';
import { useAuthStore } from '@/store/authStore';
import type { ConnectorType } from '@/types';

function LanguageSection() {
  const { t, i18n } = useTranslation();
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">{t('profile.language')}</Text>
      <View className="flex-row gap-2">
        {SUPPORTED_LANGUAGES.map(({ code, label }) => {
          const selected = i18n.language === code;
          return (
            <Pressable
              key={code}
              onPress={() => setLanguage(code)}
              className={`rounded-full border px-4 py-2 ${selected ? 'border-brand bg-brand-light' : 'border-border'}`}
            >
              <Text className={selected ? 'font-medium text-brand-dark' : 'text-black'}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EditProfileSection() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [name, setName] = useState(profile?.name ?? '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);

  if (!profile) return null;

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !profile) return;
    const url = await uploadFileAsync(`users/${profile.uid}/avatar.jpg`, result.assets[0].uri);
    setPhotoUrl(url);
    await updateUserProfile(profile.uid, { photoUrl: url });
    setProfile({ ...profile, photoUrl: url });
  }

  async function saveName() {
    if (!profile || !name.trim() || name === profile.name) return;
    setIsSaving(true);
    try {
      await updateUserProfile(profile.uid, { name: name.trim() });
      setProfile({ ...profile, name: name.trim() });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">{t('profile.editProfile')}</Text>
      <Pressable onPress={pickPhoto} className="h-20 w-20 items-center justify-center self-center rounded-full bg-muted">
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="h-20 w-20 rounded-full" />
        ) : (
          <Text className="text-3xl">👤</Text>
        )}
      </Pressable>
      <TextField label={t('auth.name')} value={name} onChangeText={setName} onBlur={saveName} />
      <Button label={t('common.save')} loading={isSaving} disabled={!name.trim()} onPress={saveName} />
    </View>
  );
}

function IdentityVerificationSection() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!profile) return null;

  if (profile.hostVerificationStatus !== 'unverified') {
    return (
      <View className="gap-1 rounded-xl bg-muted p-3">
        <Text className="text-sm font-medium">{t('profile.identityVerification')}</Text>
        <Text className="text-sm text-muted-foreground">
          {t(`profile.verificationStatus.${profile.hostVerificationStatus}`)}
        </Text>
      </View>
    );
  }

  async function takeSelfie() {
    if (!profile) return;
    const url = await captureAndUploadPhoto(`users/${profile.uid}/kyc-selfie.jpg`);
    if (url) setSelfieUrl(url);
  }

  async function onSubmit() {
    if (!profile || aadhaarLast4.length !== 4 || !selfieUrl) return;
    setIsSubmitting(true);
    try {
      const patch = { aadhaarLast4, hostVerificationDocUrl: selfieUrl, hostVerificationStatus: 'pending' as const };
      await updateUserProfile(profile.uid, patch);
      setProfile({ ...profile, ...patch });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">{t('profile.identityVerification')}</Text>
      <Text className="text-xs text-muted-foreground">{t('profile.identityVerificationHint')}</Text>
      <TextField
        label={t('profile.aadhaarLast4Label')}
        value={aadhaarLast4}
        onChangeText={(v) => setAadhaarLast4(v.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
      />
      <Pressable onPress={takeSelfie} className="flex-row items-center gap-3 rounded-xl border border-border p-3">
        {selfieUrl ? (
          <Image source={{ uri: selfieUrl }} className="h-12 w-12 rounded-full" />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Text>🤳</Text>
          </View>
        )}
        <Text>{t('profile.takeSelfie')}</Text>
      </Pressable>
      <Button
        label={t('profile.submitVerification')}
        loading={isSubmitting}
        disabled={aadhaarLast4.length !== 4 || !selfieUrl}
        onPress={onSubmit}
      />
    </View>
  );
}

function PayoutAccountSection() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [vpa, setVpa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!profile) return null;

  if (profile.razorpayLinkedAccountId) {
    return (
      <View className="gap-1 rounded-xl bg-muted p-3">
        <Text className="text-sm font-medium">{t('profile.payoutAccount')}</Text>
        <Text className="text-sm text-muted-foreground">
          {t(`profile.payoutStatus.${profile.payoutAccountStatus}`)}
        </Text>
      </View>
    );
  }

  async function onSubmit() {
    if (!profile || !vpa.trim()) return;
    setIsSubmitting(true);
    try {
      const { data } = await createRazorpayLinkedAccountFn({
        name: profile.name,
        email: profile.email ?? `${profile.phone}@chargesetu.app`,
        phone: profile.phone,
        vpa: vpa.trim(),
      });
      setProfile({ ...profile, razorpayLinkedAccountId: data.accountId, payoutAccountStatus: 'pending' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">{t('profile.payoutAccount')}</Text>
      <TextField placeholder={t('profile.vpaPlaceholder')} value={vpa} onChangeText={setVpa} autoCapitalize="none" />
      <Button label={t('common.save')} loading={isSubmitting} disabled={!vpa.trim()} onPress={onSubmit} />
    </View>
  );
}

function VehicleDetailsSection() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [vehicleModel, setVehicleModel] = useState(profile?.vehicleModel ?? '');
  const [connectorType, setConnectorType] = useState<ConnectorType | null>(profile?.vehicleConnectorType ?? null);

  if (!profile) return null;

  async function save(nextModel: string, nextConnector: ConnectorType | null) {
    if (!profile) return;
    await updateUserProfile(profile.uid, { vehicleModel: nextModel || null, vehicleConnectorType: nextConnector });
    setProfile({ ...profile, vehicleModel: nextModel || null, vehicleConnectorType: nextConnector });
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">{t('profile.vehicleDetails')}</Text>
      <TextField
        placeholder={t('profile.vehicleModelPlaceholder')}
        value={vehicleModel}
        onChangeText={setVehicleModel}
        onBlur={() => save(vehicleModel, connectorType)}
      />
      <ConnectorTypePicker
        value={connectorType ? [connectorType] : []}
        onChange={(next) => {
          const nextConnector = next[next.length - 1] ?? null;
          setConnectorType(nextConnector);
          void save(vehicleModel, nextConnector);
        }}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();

  return (
    <Screen scroll className="gap-6 pt-4">
      <Text className="text-xl font-bold">{t('profile.title')}</Text>

      <EditProfileSection />
      <LanguageSection />
      <VehicleDetailsSection />
      <IdentityVerificationSection />
      <PayoutAccountSection />
    </Screen>
  );
}
