import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  endSession,
  fetchSessionById,
  fetchSessionsForHost,
  setSessionHostConfirmation,
  startSession,
} from '@/features/sessions/api';

export const sessionKeys = {
  byId: (id: string) => ['sessions', 'detail', id] as const,
};

export function useSession(sessionId: string | null) {
  return useQuery({
    queryKey: sessionKeys.byId(sessionId ?? ''),
    queryFn: () => fetchSessionById(sessionId as string),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => (query.state.data?.endedAt ? false : 15_000),
  });
}

export function useStartSession(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (startPhotoUrl: string) => startSession(sessionId, startPhotoUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.byId(sessionId) }),
  });
}

export function useEndSession(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { endPhotoUrl: string; startedAt: number; hourlyRateAtBooking: number; minSessionCharge: number }) =>
      endSession({ sessionId, ...args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.byId(sessionId) }),
  });
}

export function useHostSessions(hostId: string | null) {
  return useQuery({
    queryKey: ['sessions', 'host', hostId ?? ''],
    queryFn: () => fetchSessionsForHost(hostId as string),
    enabled: Boolean(hostId),
  });
}

export function useSetSessionHostConfirmation(hostId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: 'confirmed' | 'disputed' }) =>
      setSessionHostConfirmation(sessionId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions', 'host', hostId ?? ''] }),
  });
}
