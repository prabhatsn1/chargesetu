import { getDownloadURL, putFile, ref } from '@react-native-firebase/storage';

import { storage } from '@/services/firebase';

/** Uploads a local file (from expo-image-picker/expo-camera) and returns its public download URL. */
export async function uploadFileAsync(storagePath: string, localUri: string): Promise<string> {
  const storageRef = ref(storage, storagePath);
  await putFile(storageRef, localUri);
  return getDownloadURL(storageRef);
}
