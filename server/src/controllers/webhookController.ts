import type { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getPaymentProvider } from '../services/payments/index.js';
import { restockOrderItems } from '../utils/restock.js';

const KNOWN_PROVIDERS = ['gateway'] as const;

export async function handlePaymentWebhook(req: Request, res: Response) {
  const providerKey = req.params.provider;
  if (!KNOWN_PROVIDERS.includes(providerKey as (typeof KNOWN_PROVIDERS)[number])) {
    throw new ApiError(404, `Unknown payment provider: ${providerKey}`);
  }

  const provider = getPaymentProvider(providerKey as 'gateway');

  let eventId: string;
  let ref: string;
  let status: 'paid' | 'failed';
  try {
    ({ eventId, ref, status } = await provider.verifyWebhook(req));
  } catch {
    throw new ApiError(401, 'Invalid webhook signature');
  }

  // Idempotency (§5): a duplicate eventId means the gateway retried a
  // webhook we already handled — ack with 200 and do nothing further.
  try {
    await WebhookEvent.create({ provider: providerKey, eventId, payload: req.body });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    throw err;
  }

  const order = await Order.findOne({ paymentRef: ref });
  if (!order) {
    // Nothing to reconcile locally, but ack anyway so the gateway stops retrying.
    console.warn(`[webhook] no order found for paymentRef=${ref}`);
    return res.status(200).json({ received: true });
  }

  // Payment status is only ever flipped here — never from a frontend
  // redirect/return URL (§5).
  if (status === 'paid') {
    order.paymentStatus = 'paid';
    await order.save();
    // Gateway orders keep their cart until payment actually succeeds, so a
    // failed/abandoned attempt doesn't lose the user's items.
    await Cart.updateOne({ user: order.user }, { $set: { items: [] } });
  } else {
    order.paymentStatus = 'failed';
    order.orderStatus = 'cancelled';
    await order.save();
    await restockOrderItems(order);
  }

  res.status(200).json({ received: true });
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000;
}
