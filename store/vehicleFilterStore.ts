import { create } from 'zustand';

import type { ConnectorType } from '@/types';

interface ChargerSearchFilters {
  connectorType: ConnectorType | null;
  maxDistanceKm: number;
  maxPricePerHour: number | null;
  availableNowOnly: boolean;
}

interface FilterState extends ChargerSearchFilters {
  setConnectorType: (value: ConnectorType | null) => void;
  setMaxDistanceKm: (value: number) => void;
  setMaxPricePerHour: (value: number | null) => void;
  setAvailableNowOnly: (value: boolean) => void;
  reset: () => void;
}

const defaults: ChargerSearchFilters = {
  connectorType: null,
  maxDistanceKm: 10,
  maxPricePerHour: null,
  availableNowOnly: false,
};

export const useChargerFilterStore = create<FilterState>((set) => ({
  ...defaults,
  setConnectorType: (value) => set({ connectorType: value }),
  setMaxDistanceKm: (value) => set({ maxDistanceKm: value }),
  setMaxPricePerHour: (value) => set({ maxPricePerHour: value }),
  setAvailableNowOnly: (value) => set({ availableNowOnly: value }),
  reset: () => set(defaults),
}));
