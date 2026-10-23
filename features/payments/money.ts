import { CURRENCY, GST_RATE, PLATFORM_COMMISSION_RATE } from '@/config/constants';

export interface SessionCostBreakdown {
  /** What the Chargee pays in total. */
  totalAmount: number;
  /** Platform commission, carved out of totalAmount. */
  commissionAmount: number;
  /** GST on the commission only, carved out of commissionAmount — not added on top. */
  gstAmount: number;
  /** What the Host receives after commission (which already includes GST). */
  hostPayoutAmount: number;
}

/**
 * time-based billing: totalAmount = hourlyRate * elapsedMinutes / 60,
 * floored at minSessionCharge. GST applies only to the commission slice.
 */
export function computeSessionCost(
  hourlyRate: number,
  elapsedMinutes: number,
  minSessionCharge: number,
): SessionCostBreakdown {
  const rawAmount = (hourlyRate * elapsedMinutes) / 60;
  const totalAmount = roundToPaise(Math.max(rawAmount, minSessionCharge));
  const commissionAmount = roundToPaise(totalAmount * PLATFORM_COMMISSION_RATE);
  const gstAmount = roundToPaise(commissionAmount * GST_RATE);
  const hostPayoutAmount = roundToPaise(totalAmount - commissionAmount);

  return { totalAmount, commissionAmount, gstAmount, hostPayoutAmount };
}

function roundToPaise(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatInr(amount: number): string {
  return `${CURRENCY.symbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function rupeesToPaise(amount: number): number {
  return Math.round(amount * 100);
}
