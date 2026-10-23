import { createHmac, timingSafeEqual } from 'node:crypto';

import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';

import './admin';
import { handlePaymentCaptured, handlePaymentFailed } from './payments';
import { razorpayWebhookSecret } from './razorpay';

function isValidSignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

/** Single webhook URL for all subscribed Razorpay events — configure this in the Razorpay dashboard. */
export const razorpayWebhook = onRequest({ secrets: [razorpayWebhookSecret] }, async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  if (!isValidSignature(req.rawBody, signature, razorpayWebhookSecret.value())) {
    res.status(400).send('Invalid signature');
    return;
  }

  const { event, payload } = req.body as {
    event: string;
    payload: {
      payment?: { entity: { id: string; notes?: Record<string, string> } };
      account?: { entity: { id: string; status: string } };
    };
  };

  switch (event) {
    case 'payment.captured':
      if (payload.payment) await handlePaymentCaptured(payload.payment.entity);
      break;
    case 'payment.failed':
      if (payload.payment) await handlePaymentFailed(payload.payment.entity);
      break;
    case 'account.activated':
    case 'account.under_review':
    case 'account.needs_clarification':
    case 'account.rejected': {
      if (!payload.account) break;
      const suffix = event.split('.')[1];
      // This tracks the Razorpay Route payout account only — separate from
      // hostVerificationStatus, which is the Aadhaar+selfie identity check (§4).
      const status = suffix === 'activated' ? 'activated' : suffix === 'rejected' ? 'rejected' : 'under_review';
      const usersSnap = await getFirestore()
        .collection('users')
        .where('razorpayLinkedAccountId', '==', payload.account.entity.id)
        .limit(1)
        .get();
      if (!usersSnap.empty) {
        await usersSnap.docs[0].ref.update({ payoutAccountStatus: status });
      }
      break;
    }
    default:
      logger.info(`Unhandled Razorpay webhook event: ${event}`);
  }

  res.status(200).send('ok');
});
