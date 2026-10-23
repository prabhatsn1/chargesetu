import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { updateUserProfile } from '@/features/auth/profile';
import { uploadFileAsync } from '@/services/storageUpload';
import { useAuthStore } from '@/store/authStore';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'required'),
  email: z.union([z.literal(''), z.string().email('invalid')]),
});
type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const profile = useAuthStore((s) => s.profile);

  const [photoUri, setPhotoUri] = useState<string | null>(profile?.photoUrl ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile?.name ?? '', email: profile?.email ?? '' },
  });

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function onSubmit({ name, email }: ProfileForm) {
    if (!firebaseUid) return;
    setIsSubmitting(true);
    try {
      let photoUrl = profile?.photoUrl ?? null;
      if (photoUri && photoUri !== profile?.photoUrl) {
        photoUrl = await uploadFileAsync(`users/${firebaseUid}/avatar.jpg`, photoUri);
      }

      const patch = { name, email: email || null, photoUrl };
      await updateUserProfile(firebaseUid, patch);
      setProfile(profile ? { ...profile, ...patch } : null);
      router.replace('/(tabs)');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen scroll className="gap-6 pt-8">
      <Text className="text-xl font-bold">{t('auth.profileSetupTitle')}</Text>

      <Pressable onPress={pickPhoto} className="h-24 w-24 items-center justify-center self-center rounded-full bg-muted">
        {photoUri ? (
          <Image source={{ uri: photoUri }} className="h-24 w-24 rounded-full" />
        ) : (
          <Text className="text-3xl">👤</Text>
        )}
      </Pressable>

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label={t('auth.name')}
            value={field.value}
            onChangeText={field.onChange}
            error={formState.errors.name ? t('common.error.generic') : undefined}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label={t('auth.emailOptional')}
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            error={formState.errors.email ? t('common.error.generic') : undefined}
          />
        )}
      />

      <Button label={t('common.next')} loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
    </Screen>
  );
}
