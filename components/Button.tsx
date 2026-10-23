import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand active:bg-brand-dark',
  secondary: 'bg-muted active:bg-border',
  danger: 'bg-danger active:bg-red-700',
  ghost: 'bg-transparent active:bg-muted',
};

const VARIANT_TEXT_CLASSES: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-black',
  danger: 'text-white',
  ghost: 'text-brand',
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
  ...pressableProps
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-xl px-4 py-3 ${VARIANT_CLASSES[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#16A34A' : '#FFFFFF'} />
      ) : (
        <Text className={`text-base font-semibold ${VARIANT_TEXT_CLASSES[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
