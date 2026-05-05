import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let permissionRequested = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const settings = await Notifications.getPermissionsAsync();
  if (settings.status === 'granted') return true;

  if (permissionRequested) return false;
  permissionRequested = true;

  const result = await Notifications.requestPermissionsAsync();
  return result.status === 'granted';
}

export async function notifyImmediate(title: string, body: string): Promise<void> {
  const ok = await ensureNotificationPermissions();
  if (!ok) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    // notifications podem falhar em ambiente de simulador/web — silencia
  }
}

export async function scheduleNotification(
  title: string,
  body: string,
  secondsFromNow: number,
): Promise<string | null> {
  const ok = await ensureNotificationPermissions();
  if (!ok) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.floor(secondsFromNow)),
        repeats: false,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // ignora se ja nao existir
  }
}
