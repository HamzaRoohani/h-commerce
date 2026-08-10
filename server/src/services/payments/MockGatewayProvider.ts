import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentProvider } from './PaymentProvider.js';
import { env } from '../../config/env.js';

export type MockWebhookPayload = {
  eventId: string;
  ref: string;
  orderNumber: string;
  status: 'paid' | 'failed';
};

export function signMockPayload(payload: MockWebhookPayload): string {
  const message = `${payload.eventId}.${payload.ref}.${payload.orderNumber}.${payload.status}`;
  return createHmac('sha256', env.MOCK_GATEWAY_SECRET).update(message).digest('hex');
}

/**
 * Self-contained stand-in for a real local gateway (PayFast/Safepay/
 * Simpaisa — see docs/ADR.md ADR-003). Same redirect + signed-webhook
 * shape as the real thing, so swapping providers later doesn't touch the
 * checkout/webhook plumbing, only this file.
 */
export const MockGatewayProvider: PaymentProvider = {
  async createPaymentIntent(order) {
    return {
      ref: `MOCKGW-${order.orderNumber}`,
      redirectUrl: `/checkout/mock-gateway/${order.orderNumber}`,
    };
  },

  async verifyWebhook(req) {
    const payload = req.body as Partial<MockWebhookPayload>;
    if (!payload.eventId || !payload.ref || !payload.orderNumber || !payload.status) {
      throw new Error('Malformed mock gateway webhook payload');
    }

    const expected = signMockPayload(payload as MockWebhookPayload);
    const provided = req.header('x-mock-signature') ?? '';

    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(provided, 'hex');
    const valid =
      expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);

    if (!valid) {
      throw new Error('Invalid mock gateway webhook signature');
    }

    return { eventId: payload.eventId, ref: payload.ref, status: payload.status };
  },
};
