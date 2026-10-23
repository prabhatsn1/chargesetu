import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingView() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <ActivityIndicator size="large" color="#16A34A" />
      <Text className="text-muted-foreground">{t('common.loading')}</Text>
    </View>
  );
}
