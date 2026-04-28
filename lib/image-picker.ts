import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

export async function pickFromLibrary(): Promise<PickedImage | null> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) return null;

  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}

export async function pickFromCamera(): Promise<PickedImage | null> {
  if (Platform.OS === 'web') return null;

  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) return null;

  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}
