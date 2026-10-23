import RazorpayCheckout from 'react-native-razorpay';

import { CURRENCY } from '@/config/constants';

const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID as string;

export interface RazorpayOrder {
  orderId: string;
  amountPaise: number;
}

export interface RazorpayPaymentResult {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

interface OpenCheckoutArgs {
  order: RazorpayOrder;
  sessionId: string;
  userName: string;
  userEmail?: string | null;
  userPhone: string;
}

/**
 * Opens Razorpay's hosted checkout for a session payment.
 * The order (and the Route split to the Host's linked account) is created
 * server-side by a Cloud Function — this only collects the Chargee's payment.
 */
export async function openRazorpayCheckout({
  order,
  sessionId,
  userName,
  userEmail,
  userPhone,
}: OpenCheckoutArgs): Promise<RazorpayPaymentResult> {
  const result = await RazorpayCheckout.open({
    key: RAZORPAY_KEY_ID,
    order_id: order.orderId,
    amount: order.amountPaise,
    currency: CURRENCY.code,
    name: 'ChargeSetu',
    description: `Charging session ${sessionId}`,
    prefill: {
      name: userName,
      email: userEmail ?? undefined,
      contact: userPhone,
    },
    theme: { color: '#16A34A' },
  });

  return {
    razorpayPaymentId: result.razorpay_payment_id,
    razorpayOrderId: result.razorpay_order_id,
    razorpaySignature: result.razorpay_signature,
  };
}
