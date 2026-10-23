import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

import './admin';
import { sendPushToUser } from './notify';
import { getRazorpayClient, razorpayKeyId, razorpayKeySecret } from './razorpay';

interface CreateOrderRequest {
  sessionId: string;
}

/** Called by the Chargee's payment screen right before opening Razorpay Checkout. */
export const createRazorpayOrder = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request): Promise<{ orderId: string; amountPaise: number }> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');

    const { sessionId } = request.data as CreateOrderRequest;
    const sessionRef = getFirestore().collection('sessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    const session = sessionSnap.data();
    if (!session) throw new HttpsError('not-found', 'Session not found.');
    if (session.chargeeId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Only the Chargee for this session can pay for it.');
    }
    if (!session.totalAmount || !session.hostPayoutAmount) {
      throw new HttpsError('failed-precondition', 'Session has not ended yet.');
    }

    const hostSnap = await getFirestore().collection('users').doc(session.hostId).get();
    const hostAccountId = hostSnap.data()?.razorpayLinkedAccountId as string | undefined;

    const amountPaise = Math.round(session.totalAmount * 100);
    const hostPayoutPaise = Math.round(session.hostPayoutAmount * 100);

    const order = await getRazorpayClient().orders.create({
      amount: amountPaise,
      currency: 'INR',
      payment_capture: true,
      notes: { sessionId },
      // Route split only once the Host has a linked account; otherwise the
      // platform collects the full amount and the Host is paid out manually.
      ...(hostAccountId
        ? {
            transfers: [
              {
                account: hostAccountId,
                amount: hostPayoutPaise,
                currency: 'INR',
                on_hold: false,
              },
            ],
          }
        : {}),
    });

    await sessionRef.update({ razorpayOrderId: order.id });
    return { orderId: order.id, amountPaise };
  },
);

interface CreateLinkedAccountRequest {
  name: string;
  email: string;
  phone: string;
  bankAccountNumber?: string;
  ifsc?: string;
  vpa?: string;
}

/**
 * Creates a Razorpay Route linked account for a Host's payouts. Razorpay owns
 * KYC review from here (§4 "Payouts") — this only submits the basic details
 * their hosted review process needs to start.
 */
export const createRazorpayLinkedAccount = onCall(
  { secrets: [razorpayKeyId, razorpayKeySecret] },
  async (request): Promise<{ accountId: string }> => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
    const input = request.data as CreateLinkedAccountRequest;

    const response = await fetch('https://api.razorpay.com/v2/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${razorpayKeyId.value()}:${razorpayKeySecret.value()}`).toString('base64')}`,
      },
      body: JSON.stringify({
        email: input.email,
        phone: input.phone,
        type: 'route',
        legal_business_name: input.name,
        business_type: 'individual',
        contact_name: input.name,
        profile: {
          category: 'others',
          subcategory: 'others',
        },
        ...(input.vpa
          ? { notes: { vpa: input.vpa } }
          : input.bankAccountNumber && input.ifsc
            ? {
                bank_account: {
                  name: input.name,
                  ifsc: input.ifsc,
                  account_number: input.bankAccountNumber,
                },
              }
            : {}),
      }),
    });

    const body = (await response.json()) as { id?: string; error?: { description?: string } };
    if (!response.ok || !body.id) {
      logger.error('Razorpay linked account creation failed', body);
      throw new HttpsError('internal', body.error?.description ?? 'Could not create payout account.');
    }

    await getFirestore().collection('users').doc(request.auth.uid).update({
      razorpayLinkedAccountId: body.id,
      payoutAccountStatus: 'pending',
    });

    return { accountId: body.id };
  },
);

export async function handlePaymentCaptured(payload: {
  id: string;
  notes?: Record<string, string>;
}): Promise<void> {
  const sessionId = payload.notes?.sessionId;
  if (!sessionId) return;

  const sessionRef = getFirestore().collection('sessions').doc(sessionId);
  await sessionRef.update({ paymentStatus: 'paid', razorpayPaymentId: payload.id });

  const session = (await sessionRef.get()).data();
  if (session) {
    await sendPushToUser(session.chargeeId, 'Payment received', 'Your charging session payment was successful.', {
      kind: 'payment_receipt',
      sessionId,
    });
  }
}

export async function handlePaymentFailed(payload: {
  notes?: Record<string, string>;
}): Promise<void> {
  const sessionId = payload.notes?.sessionId;
  if (!sessionId) return;
  await getFirestore().collection('sessions').doc(sessionId).update({ paymentStatus: 'failed' });
}
