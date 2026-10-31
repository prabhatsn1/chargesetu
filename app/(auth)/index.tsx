import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAppleSignIn } from '@/features/auth/useAppleSignIn';
import { useGoogleSignIn } from '@/features/auth/useGoogleSignIn';
import { usePhoneAuth } from '@/features/auth/usePhoneAuth';

const phoneSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'auth.errors.invalidPhone'),
});
type PhoneForm = z.infer<typeof phoneSchema>;

export default function PhoneEntryScreen() {
  const { t } = useTranslation();
  const { sendOtp, isSending, error } = usePhoneAuth();
  const { signInWithGoogle, isSigningIn: isGoogleSigningIn } = useGoogleSignIn();
  const { signInWithApple, isSigningIn: isAppleSigningIn, isAvailable: isAppleAvailable } = useAppleSignIn();

  const { control, handleSubmit, formState } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  async function onSubmit({ phone }: PhoneForm) {
    const ok = await sendOtp(phone);
    if (ok) router.push('/(auth)/otp');
  }

  return (
    <Screen className="justify-center gap-6">
      <View className="items-center gap-1">
        <Text className="text-3xl font-bold text-brand">{t('common.appName')}</Text>
        <Text className="text-base text-muted-foreground">{t('auth.phoneTitle')}</Text>
      </View>

      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <TextField
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            maxLength={10}
            value={field.value}
            onChangeText={field.onChange}
            error={
              formState.errors.phone
                ? t(formState.errors.phone.message ?? 'auth.errors.invalidPhone')
                : (error ?? undefined)
            }
          />
        )}
      />

      <Button
        label={t('auth.sendOtp')}
        loading={isSending}
        onPress={() => handleSubmit(onSubmit)()}
      />

      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-sm text-muted-foreground">{t('auth.orContinueWith')}</Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <Button
        label={t('auth.continueWithGoogle')}
        variant="secondary"
        loading={isGoogleSigningIn}
        onPress={signInWithGoogle}
      />
      {isAppleAvailable ? (
        <Button
          label={t('auth.continueWithApple')}
          variant="secondary"
          loading={isAppleSigningIn}
          onPress={signInWithApple}
        />
      ) : null}
    </Screen>
  );
}
