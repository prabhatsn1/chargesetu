/** India-only MVP (§4) — accepts a 10-digit local number and returns E.164 (+91XXXXXXXXXX). */
export function toE164India(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return null;
}

export function formatPhoneForDisplay(e164Phone: string): string {
  const digits = e164Phone.replace(/^\+91/, '');
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
