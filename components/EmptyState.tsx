import { Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  icon?: string;
}

export function EmptyState({ title, icon = '🔌' }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="mb-2 text-4xl">{icon}</Text>
      <Text className="text-center text-base text-muted-foreground">{title}</Text>
    </View>
  );
}
