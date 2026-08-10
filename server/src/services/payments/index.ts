import type { PaymentProvider } from './PaymentProvider.js';
import { CodProvider } from './CodProvider.js';

const registry: Partial<Record<'cod' | 'gateway', PaymentProvider>> = {
  cod: CodProvider,
  // gateway: wired in Phase 5 (PayFast/Safepay/Simpaisa — TBD).
};

export function getPaymentProvider(method: 'cod' | 'gateway'): PaymentProvider {
  const provider = registry[method];
  if (!provider) {
    throw new Error(`Payment method "${method}" is not configured yet`);
  }
  return provider;
}
