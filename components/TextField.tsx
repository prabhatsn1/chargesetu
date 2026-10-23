import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, className, ...inputProps }: TextFieldProps & { className?: string }) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-black">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9CA3AF"
        className={`rounded-xl border px-4 py-3 text-base text-black ${error ? 'border-danger' : 'border-border'} ${className ?? ''}`}
        {...inputProps}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
