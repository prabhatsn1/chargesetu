import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCharger,
  fetchChargerById,
  fetchChargersByHost,
  setChargerPaused,
  updateCharger,
  type CreateChargerInput,
} from '@/features/chargers/api';
import type { Charger } from '@/types';

export const chargerKeys = {
  byHost: (hostId: string) => ['chargers', 'host', hostId] as const,
  byId: (chargerId: string) => ['chargers', 'detail', chargerId] as const,
};

export function useHostChargers(hostId: string | null) {
  return useQuery({
    queryKey: chargerKeys.byHost(hostId ?? ''),
    queryFn: () => fetchChargersByHost(hostId as string),
    enabled: Boolean(hostId),
  });
}

export function useCharger(chargerId: string | null) {
  return useQuery({
    queryKey: chargerKeys.byId(chargerId ?? ''),
    queryFn: () => fetchChargerById(chargerId as string),
    enabled: Boolean(chargerId),
  });
}

export function useCreateCharger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChargerInput) => createCharger(input),
    onSuccess: (_id, variables) => {
      queryClient.invalidateQueries({ queryKey: chargerKeys.byHost(variables.hostId) });
    },
  });
}

export function useSetChargerPaused(hostId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chargerId, isPaused }: { chargerId: string; isPaused: boolean }) =>
      setChargerPaused(chargerId, isPaused),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chargerKeys.byHost(hostId) }),
  });
}

export function useUpdateCharger(hostId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chargerId, patch }: { chargerId: string; patch: Partial<Charger> }) =>
      updateCharger(chargerId, patch),
    onSuccess: (_void, variables) => {
      queryClient.invalidateQueries({ queryKey: chargerKeys.byHost(hostId) });
      queryClient.invalidateQueries({ queryKey: chargerKeys.byId(variables.chargerId) });
    },
  });
}
