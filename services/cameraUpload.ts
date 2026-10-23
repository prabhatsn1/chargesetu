import * as ImagePicker from 'expo-image-picker';

import { uploadFileAsync } from '@/services/storageUpload';

/** Opens the camera, uploads the photo, and returns its download URL — null if the user cancels. */
export async function captureAndUploadPhoto(storagePath: string): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (result.canceled) return null;

  return uploadFileAsync(storagePath, result.assets[0].uri);
}
