import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { Screen } from '@/components/Screen';
import { useMarkNotificationRead, useNotifications } from '@/features/notifications/hooks';
import { useAuthStore } from '@/store/authStore';
import type { AppNotification } from '@/types';

function targetRoute(notification: AppNotification): Href | null {
  switch (notification.kind) {
    case 'booking_requested':
    case 'booking_accepted':
    case 'booking_declined':
      return notification.bookingId ? (`/booking/${notification.bookingId}` as Href) : null;
    case 'session_started':
    case 'session_ended':
    case 'session_confirmation_needed':
      return notification.sessionId ? (`/session/${notification.sessionId}` as Href) : null;
    case 'payment_receipt':
      return notification.sessionId ? (`/payment/${notification.sessionId}` as Href) : null;
    case 'payout_confirmed':
      return '/host/earnings' as Href;
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const uid = useAuthStore((s) => s.firebaseUid);
  const { data: notifications, isLoading, isError, refetch } = useNotifications(uid);
  const markRead = useMarkNotificationRead(uid);

  function onPress(notification: AppNotification) {
    if (!notification.read) markRead.mutate(notification.id);
    const route = targetRoute(notification);
    if (route) router.push(route);
  }

  return (
    <Screen scroll className="gap-3 pt-4">
      <Text className="text-xl font-bold">{t('notifications.title')}</Text>
      {isLoading ? (
        <ActivityIndicator color="#16A34A" />
      ) : isError ? (
        <ErrorView onRetry={refetch} />
      ) : notifications && notifications.length > 0 ? (
        <View className="gap-2">
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => onPress(notification)}
              className={`gap-1 rounded-xl border border-border p-3 ${notification.read ? '' : 'bg-brand-light'}`}
            >
              <Text className="font-medium">{notification.title}</Text>
              <Text className="text-sm text-muted-foreground">{notification.body}</Text>
              <Text className="text-xs text-muted-foreground">
                {new Date(notification.createdAt).toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState title={t('notifications.empty')} icon="🔔" />
      )}
    </Screen>
  );
}
