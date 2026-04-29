import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
};

/**
 * No web, expo-image-picker retorna blob: URLs que são session-scoped — quando
 * o usuário recarrega a página, a URL expira e Image dá ERR_FILE_NOT_FOUND.
 * Pra evitar isso, convertemos blob: pra data: URL (base64) antes de persistir.
 */
async function persistirNoWeb(uri: string): Promise<string> {
  if (Platform.OS !== 'web') return uri;
  if (!uri.startsWith('blob:')) return uri;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('FileReader não retornou string'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader erro'));
      reader.readAsDataURL(blob);
    });
  } catch {
    // se falhar, devolve a URI original — vai aparecer com fallback no Avatar
    return uri;
  }
}

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

  const uri = await persistirNoWeb(asset.uri);

  return {
    uri,
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
