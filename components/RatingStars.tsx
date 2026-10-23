import { Pressable, Text, View } from 'react-native';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function RatingStars({ value, onChange, size = 28 }: RatingStarsProps) {
  const isInteractive = Boolean(onChange);
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const Wrapper = isInteractive ? Pressable : View;
        return (
          <Wrapper key={star} onPress={isInteractive ? () => onChange?.(star) : undefined}>
            <Text style={{ fontSize: size }} className={filled ? 'text-amber-500' : 'text-border'}>
              ★
            </Text>
          </Wrapper>
        );
      })}
    </View>
  );
}
