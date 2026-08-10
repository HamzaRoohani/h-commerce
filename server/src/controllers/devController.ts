import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { signMockPayload } from '../services/payments/MockGatewayProvider.js';
import { expireStalePendingOrders } from '../services/pendingOrderExpiry.js';

const simulateSchema = z.object({ outcome: z.enum(['paid', 'failed']) });
const backdateSchema = z.object({ minutesAgo: z.coerce.number().positive() });

/**
 * Dev-only stand-in for a real gateway's server-to-server webhook call.
 * Never mounted in production (see app.ts) — a real gateway would call
 * POST /api/webhooks/payments/:provider directly, which is exactly what
 * this does, just triggered by a button instead of an actual bank.
 */
export async function simulateMockGatewayWebhook(req: Request, res: Response) {
  const { outcome } = simulateSchema.parse(req.body);
  const uid = (req as AuthedRequest).user.id;

  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: uid });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentMethod !== 'gateway' || order.paymentStatus !== 'pending') {
    throw new ApiError(400, 'Order is not awaiting gateway payment');
  }

  const payload = {
    eventId: randomUUID(),
    ref: order.paymentRef ?? '',
    orderNumber: order.orderNumber,
    status: outcome,
  };
  const signature = signMockPayload(payload);

  const webhookRes = await fetch(`http://localhost:${env.PORT}/api/webhooks/payments/gateway`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-mock-signature': signature },
    body: JSON.stringify(payload),
  });

  res.status(200).json({ simulated: outcome, webhookStatus: webhookRes.status });
}

/**
 * Test-only: backdate an order so the expiry sweep has something to catch
 * without waiting real minutes. `timestamps: true` marks `createdAt`
 * `immutable: true` by default, so Mongoose silently drops it from both
 * `doc.save()` and `Model.updateOne()` — even `$set` gets stripped before
 * it reaches Mongo. `.collection.updateOne` bypasses the schema layer
 * entirely and writes directly through the native driver.
 */
export async function backdateOrder(req: Request, res: Response) {
  const { minutesAgo } = backdateSchema.parse(req.body);
  const uid = (req as AuthedRequest).user.id;

  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: uid });
  if (!order) throw new ApiError(404, 'Order not found');

  const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000);
  await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt } });

  res.status(200).json({ orderNumber: order.orderNumber, createdAt });
}

export async function triggerExpirySweep(_req: Request, res: Response) {
  const count = await expireStalePendingOrders();
  res.status(200).json({ cancelled: count });
}
