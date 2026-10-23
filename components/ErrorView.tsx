import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';

interface ErrorViewProps {
  onRetry?: () => void;
}

export function ErrorView({ onRetry }: ErrorViewProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-16">
      <Text className="text-center text-base text-muted-foreground">{t('common.error.generic')}</Text>
      {onRetry ? <Button label={t('common.retry')} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}
