import { Pressable, Text, View } from 'react-native';

import { CONNECTOR_TYPES } from '@/config/constants';
import type { ConnectorType } from '@/types';

interface ConnectorTypePickerProps {
  value: ConnectorType[];
  onChange: (value: ConnectorType[]) => void;
}

export function ConnectorTypePicker({ value, onChange }: ConnectorTypePickerProps) {
  function toggle(type: ConnectorType) {
    onChange(value.includes(type) ? value.filter((t) => t !== type) : [...value, type]);
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {CONNECTOR_TYPES.map((type) => {
        const selected = value.includes(type);
        return (
          <Pressable
            key={type}
            onPress={() => toggle(type)}
            className={`rounded-full border px-3 py-2 ${selected ? 'border-brand bg-brand-light' : 'border-border bg-surface'}`}
          >
            <Text className={selected ? 'text-brand-dark font-medium' : 'text-black'}>{type}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
