import { Product } from '../models/Product.js';
import type { OrderDoc } from '../models/Order.js';

/** Reverses the atomic decrement from order creation (§8) for a cancelled/failed order. */
export async function restockOrderItems(order: OrderDoc): Promise<void> {
  await Promise.all(
    order.items.map((item) =>
      Product.updateOne(
        { _id: item.product, 'variants.sku': item.variantSku },
        { $inc: { 'variants.$.stock': item.qty } },
      ),
    ),
  );
}
