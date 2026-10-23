import { useQuery } from '@tanstack/react-query';

import { fetchUserProfile } from '@/features/auth/profile';

export function useUserProfile(uid: string | null) {
  return useQuery({
    queryKey: ['users', uid ?? ''],
    queryFn: () => fetchUserProfile(uid as string),
    enabled: Boolean(uid),
  });
}
