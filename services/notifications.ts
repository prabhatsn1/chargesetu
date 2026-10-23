import { getToken, onMessage, requestPermission, AuthorizationStatus } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { messaging } from '@/services/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type NotificationKind =
  | 'booking_requested'
  | 'booking_accepted'
  | 'booking_declined'
  | 'session_started'
  | 'session_ended'
  | 'session_confirmation_needed'
  | 'payment_receipt'
  | 'payout_confirmed';

export interface NotificationData {
  kind: NotificationKind;
  bookingId?: string;
  sessionId?: string;
}

/**
 * Requests permission, returns the native FCM device token to store on the
 * user's profile, and starts showing foreground pushes as local banners
 * (FCM only surfaces background/quit-state notifications via the OS tray).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const authStatus = await requestPermission(messaging);
  const granted =
    authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
  if (!granted) return null;

  return getToken(messaging);
}

export function subscribeToForegroundNotifications() {
  return onMessage(messaging, async (remoteMessage) => {
    const { title, body } = remoteMessage.notification ?? {};
    if (!title && !body) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: remoteMessage.data },
      trigger: null,
    });
  });
}
