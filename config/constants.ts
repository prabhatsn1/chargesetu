/**
 * Single source of truth for business-rule constants.
 * Change rates here, not inline at call sites.
 */

export const CURRENCY = {
  code: 'INR',
  symbol: '₹',
} as const;

/** Platform commission taken from the Chargee's total payment, before GST. */
export const PLATFORM_COMMISSION_RATE = 0.15;

/** GST rate applied to the platform commission fee only, not the full transaction. */
export const GST_RATE = 0.18;

/** Default margin the Rate Calculator suggests over the baseline cost-per-kWh estimate. */
export const DEFAULT_HOST_RATE_MARGIN = 0.2;

/** Fallback cost-per-kWh (₹) used by the Rate Calculator when no local tariff is supplied. */
export const DEFAULT_COST_PER_KWH = 8;

/** Assumed average power draw (kW) used to translate a ₹/kWh baseline into a ₹/hour suggestion. */
export const DEFAULT_ASSUMED_POWER_KW = 7;

/** Hours a Host has to confirm a reported session before it auto-confirms. */
export const SESSION_AUTO_CONFIRM_WINDOW_HOURS = 24;

/** Days after a confirmed session before Razorpay Route payout is expected to land. */
export const PAYOUT_ETA_DAYS = 3;

export const CONNECTOR_TYPES = [
  'Type 2 AC',
  'CCS2',
  'Bharat AC-001',
  'Bharat DC-001',
  'GB/T',
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
] as const;

export const IST_TIMEZONE = 'Asia/Kolkata';
