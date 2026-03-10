import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// SDK 53 Architectural Isolation
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const isAndroid = Platform.OS === 'android';

let Notifications = null;

// Only even attempt to load notifications if we are NOT on Android Expo Go
// In SDK 53+, the library itself throws a fatal error if loaded in Expo Go on Android
if (!(isAndroid && isExpoGo)) {
    try {
        // Using require instead of top-level import to prevent crash during module load on Android SDK 53+ Expo Go
        Notifications = require('expo-notifications');
        
        if (Notifications && Notifications.setNotificationHandler) {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                }),
            });
        }
    } catch (e) {
        console.warn('[PUSH ARCHITECTURE] Failed to load expo-notifications module.');
    }
}

// Export safe reference
export const SafeNotifications = Notifications;

export async function registerForPushNotificationsAsync() {
  if (!Notifications || (isAndroid && isExpoGo)) {
    if (isAndroid && isExpoGo) {
        console.warn('PUSH NOTIFICATIONS: Remote push is disabled by Expo on Android Expo Go (SDK 53+). Please use a development build to test this feature.');
    }
    return null;
  }

  let token;

  // Push notifications only work on physical devices, not simulators
  const isDevice = Constants.isDevice;
  if (!isDevice) {
    console.log('[PUSH] Must run on a physical device for push notifications.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[PUSH] Notification permission denied.');
    return null;
  }

  // Token retrieval block
  try {
     const projectId = Constants.expoConfig?.extra?.eas?.projectId;
     token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
     console.log('[PUSH TOKEN]:', token);

     await api.post('/auth/push-token', { token });
  } catch (err) {
     console.log('[PUSH ERROR] Token retrieval failed (Common in SDK 53+ Go):', err.message);
  }

  return token;
}

export function subscribeToNotifications(handler) {
  if (!Notifications || (isAndroid && isExpoGo)) return null;
  return Notifications.addNotificationReceivedListener(handler);
}
