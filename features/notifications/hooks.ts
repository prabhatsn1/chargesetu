import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchNotifications, markNotificationRead } from '@/features/notifications/api';

export function useNotifications(uid: string | null) {
  return useQuery({
    queryKey: ['notifications', uid ?? ''],
    queryFn: () => fetchNotifications(uid as string),
    enabled: Boolean(uid),
  });
}

export function useMarkNotificationRead(uid: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', uid ?? ''] }),
  });
}
