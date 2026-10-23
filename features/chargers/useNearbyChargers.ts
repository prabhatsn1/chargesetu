import { getDocs, query, where } from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';

import { toCharger } from '@/features/chargers/api';
import { chargersCollection } from '@/services/firebase';

/**
 * MVP has no geo-indexed query (no geohash field yet), so this fetches every
 * active listing and leaves distance filtering/sorting to the caller —
 * fine at city-scale MVP volumes, revisit with a geohash index if it grows.
 */
export function useActiveChargers() {
  return useQuery({
    queryKey: ['chargers', 'active'],
    queryFn: async () => {
      const snapshot = await getDocs(query(chargersCollection(), where('isPaused', '==', false)));
      return snapshot.docs.map(toCharger);
    },
  });
}
