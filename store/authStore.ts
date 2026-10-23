import { create } from 'zustand';

import type { UserProfile } from '@/types';

interface AuthState {
  firebaseUid: string | null;
  profile: UserProfile | null;
  isInitializing: boolean;
  setFirebaseUid: (uid: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setInitializing: (value: boolean) => void;
  signOutLocal: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUid: null,
  profile: null,
  isInitializing: true,
  setFirebaseUid: (uid) => set({ firebaseUid: uid }),
  setProfile: (profile) => set({ profile }),
  setInitializing: (value) => set({ isInitializing: value }),
  signOutLocal: () => set({ firebaseUid: null, profile: null }),
}));
