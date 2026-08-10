import type { PaymentProvider } from './PaymentProvider.js';

/**
 * Cash on delivery — no redirect, no webhook. The order goes straight to
 * orderStatus='processing' with paymentStatus='pending', and flips to
 * 'paid' when an admin marks it delivered (Phase 7).
 */
export const CodProvider: PaymentProvider = {
  async createPaymentIntent(order) {
    return { ref: order.orderNumber };
  },

  async verifyWebhook() {
    throw new Error('CodProvider has no webhook — payment is confirmed manually on delivery');
  },
};
