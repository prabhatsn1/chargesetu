import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createBooking,
  fetchBookingById,
  fetchBookingsForChargee,
  fetchPendingBookingsForHost,
  fetchUpcomingBookingsForCharger,
  setBookingStatus,
  type CreateBookingInput,
} from '@/features/bookings/api';
import type { BookingStatus } from '@/types';

export const bookingKeys = {
  byId: (id: string) => ['bookings', 'detail', id] as const,
  forChargee: (uid: string) => ['bookings', 'chargee', uid] as const,
  pendingForHost: (uid: string) => ['bookings', 'host-pending', uid] as const,
  upcomingForCharger: (chargerId: string) => ['bookings', 'charger-upcoming', chargerId] as const,
};

export function useBooking(bookingId: string | null) {
  return useQuery({
    queryKey: bookingKeys.byId(bookingId ?? ''),
    queryFn: () => fetchBookingById(bookingId as string),
    enabled: Boolean(bookingId),
  });
}

export function useChargeeBookings(chargeeId: string | null) {
  return useQuery({
    queryKey: bookingKeys.forChargee(chargeeId ?? ''),
    queryFn: () => fetchBookingsForChargee(chargeeId as string),
    enabled: Boolean(chargeeId),
  });
}

export function useHostPendingBookings(hostId: string | null) {
  return useQuery({
    queryKey: bookingKeys.pendingForHost(hostId ?? ''),
    queryFn: () => fetchPendingBookingsForHost(hostId as string),
    enabled: Boolean(hostId),
  });
}

export function useUpcomingBookingsForCharger(chargerId: string | null) {
  return useQuery({
    queryKey: bookingKeys.upcomingForCharger(chargerId ?? ''),
    queryFn: () => fetchUpcomingBookingsForCharger(chargerId as string),
    enabled: Boolean(chargerId),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),
    onSuccess: (_id, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.forChargee(variables.chargeeId) });
    },
  });
}

export function useSetBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      setBookingStatus(bookingId, status),
    onSuccess: (_void, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.byId(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
