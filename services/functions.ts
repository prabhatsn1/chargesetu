import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

const functions = getFunctions();

export const createRazorpayOrderFn = httpsCallable<{ sessionId: string }, { orderId: string; amountPaise: number }>(
  functions,
  'createRazorpayOrder',
);

export const createRazorpayLinkedAccountFn = httpsCallable<
  { name: string; email: string; phone: string; bankAccountNumber?: string; ifsc?: string; vpa?: string },
  { accountId: string }
>(functions, 'createRazorpayLinkedAccount');
