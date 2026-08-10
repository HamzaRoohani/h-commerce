import type { Request } from 'express';
import type { OrderDoc } from '../../models/Order.js';

/**
 * ADR-003 (docs/ADR.md): controllers never call a gateway SDK directly —
 * only through this interface. CodProvider is trivial and unblocks
 * checkout with zero gateway dependency; a local gateway (PayFast/Safepay/
 * Simpaisa) slots in behind the same interface in Phase 5.
 */
export interface PaymentProvider {
  createPaymentIntent(order: OrderDoc): Promise<{ redirectUrl?: string; ref: string }>;
  verifyWebhook(req: Request): Promise<{ eventId: string; ref: string; status: 'paid' | 'failed' }>;
  refund?(order: OrderDoc): Promise<void>;
}
