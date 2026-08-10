import type { PaymentProvider } from './PaymentProvider.js';
import { CodProvider } from './CodProvider.js';
import { MockGatewayProvider } from './MockGatewayProvider.js';

const registry: Partial<Record<'cod' | 'gateway', PaymentProvider>> = {
  cod: CodProvider,
  // MockGatewayProvider today; swap for PayFast/Safepay/Simpaisa once
  // merchant sandbox credentials exist — nothing outside this file changes.
  gateway: MockGatewayProvider,
};

export function getPaymentProvider(method: 'cod' | 'gateway'): PaymentProvider {
  const provider = registry[method];
  if (!provider) {
    throw new Error(`Payment method "${method}" is not configured yet`);
  }
  return provider;
}
