import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

import { uploadFileAsync } from '@/services/storageUpload';

interface PhotoPickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  uploadPathPrefix: string;
}

export function PhotoPicker({ photos, onChange, uploadPathPrefix }: PhotoPickerProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  async function addPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;

    setIsUploading(true);
    try {
      const url = await uploadFileAsync(`${uploadPathPrefix}/${Date.now()}.jpg`, result.assets[0].uri);
      onChange([...photos, url]);
    } finally {
      setIsUploading(false);
    }
  }

  function removePhoto(url: string) {
    onChange(photos.filter((p) => p !== url));
  }

  return (
    <View className="flex-row flex-wrap gap-3">
      {photos.map((url) => (
        <Pressable key={url} onPress={() => removePhoto(url)} className="relative">
          <Image source={{ uri: url }} className="h-20 w-20 rounded-lg" />
          <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-danger">
            <Text className="text-xs text-white">✕</Text>
          </View>
        </Pressable>
      ))}
      <Pressable
        onPress={addPhoto}
        disabled={isUploading}
        className="h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border"
      >
        {isUploading ? <ActivityIndicator color="#16A34A" /> : <Text className="text-2xl text-muted-foreground">+</Text>}
      </Pressable>
      <Text className="w-full text-xs text-muted-foreground">{t('host.photos')}</Text>
    </View>
  );
}
