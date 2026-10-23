import { DEFAULT_ASSUMED_POWER_KW, DEFAULT_COST_PER_KWH, DEFAULT_HOST_RATE_MARGIN } from '@/config/constants';

/**
 * Suggests an hourly rate (₹/hr) from a ₹/kWh baseline cost, the charger's
 * power rating, and a margin — same spirit as Co Charger's rate calculator.
 */
export function suggestHourlyRate(
  powerKw: number = DEFAULT_ASSUMED_POWER_KW,
  costPerKwh: number = DEFAULT_COST_PER_KWH,
  marginRate: number = DEFAULT_HOST_RATE_MARGIN,
): number {
  const baseCostPerHour = costPerKwh * powerKw;
  return Math.round(baseCostPerHour * (1 + marginRate) * 100) / 100;
}
