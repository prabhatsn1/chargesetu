import type { TFunction } from 'i18next';

/** Maps Firebase Auth error codes to a translated, user-facing message. */
export function mapAuthErrorMessage(error: unknown, t: TFunction): string {
  const code = (error as { code?: string } | null)?.code ?? '';

  switch (code) {
    case 'auth/invalid-phone-number':
      return t('auth.errors.invalidPhone');
    case 'auth/invalid-verification-code':
    case 'auth/code-expired':
      return t('auth.errors.invalidOtp');
    case 'auth/too-many-requests':
      return t('auth.errors.tooManyRequests');
    case 'auth/network-request-failed':
      return t('common.error.network');
    default:
      return t('common.error.generic');
  }
}
