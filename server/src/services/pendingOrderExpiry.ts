import { Order } from '../models/Order.js';
import { env } from '../config/env.js';
import { restockOrderItems } from '../utils/restock.js';

/**
 * §8: gateway orders stuck in paymentStatus='pending' past the threshold
 * (abandoned checkout, dead payment session) get cancelled and their stock
 * released, so abandoned carts don't strand inventory forever.
 */
export async function expireStalePendingOrders(): Promise<number> {
  const threshold = new Date(Date.now() - env.PENDING_ORDER_EXPIRY_MINUTES * 60 * 1000);

  const staleOrders = await Order.find({
    paymentMethod: 'gateway',
    paymentStatus: 'pending',
    orderStatus: { $ne: 'cancelled' },
    createdAt: { $lt: threshold },
  });

  for (const order of staleOrders) {
    order.paymentStatus = 'failed';
    order.orderStatus = 'cancelled';
    await order.save();
    await restockOrderItems(order);
  }

  return staleOrders.length;
}
