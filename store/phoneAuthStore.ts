import type { ConfirmationResult } from '@react-native-firebase/auth';
import { create } from 'zustand';

interface PhoneAuthState {
  phone: string | null;
  confirmation: ConfirmationResult | null;
  setPending: (phone: string, confirmation: ConfirmationResult) => void;
  clear: () => void;
}

export const usePhoneAuthStore = create<PhoneAuthState>((set) => ({
  phone: null,
  confirmation: null,
  setPending: (phone, confirmation) => set({ phone, confirmation }),
  clear: () => set({ phone: null, confirmation: null }),
}));
