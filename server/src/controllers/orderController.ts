import type { Request, Response } from 'express';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { createOrderSchema } from '../validators/order.js';
import { nextOrderNumber } from '../utils/orderNumber.js';
import { calculateShippingPaisa } from '../utils/shipping.js';
import { getPaymentProvider } from '../services/payments/index.js';

function userId(req: Request): string {
  return (req as AuthedRequest).user.id;
}

type ResolvedLine = { productId: string; title: string; sku: string; qty: number; unitPricePaisa: number };

/**
 * §8: atomic per-item decrement so concurrent checkouts can't oversell.
 * On the first failure, restock everything this call already decremented
 * and abort — the whole order either fully reserves stock or none of it.
 */
async function decrementStockOrThrow(lines: ResolvedLine[]): Promise<void> {
  const decremented: ResolvedLine[] = [];

  for (const line of lines) {
    // $elemMatch is required here — two independent top-level conditions on
    // the same array field ('variants.sku' and 'variants.stock') don't have
    // to match the *same* element, so the positional $ below can silently
    // resolve to the wrong variant (e.g. decrementing size S when L was
    // ordered, as long as S also happens to satisfy the stock condition).
    const result = await Product.updateOne(
      { _id: line.productId, variants: { $elemMatch: { sku: line.sku, stock: { $gte: line.qty } } } },
      { $inc: { 'variants.$.stock': -line.qty } },
    );

    if (result.modifiedCount === 0) {
      await Promise.all(
        decremented.map((d) =>
          Product.updateOne(
            { _id: d.productId, 'variants.sku': d.sku },
            { $inc: { 'variants.$.stock': d.qty } },
          ),
        ),
      );
      throw new ApiError(409, `Out of stock: ${line.title} (${line.sku})`);
    }

    decremented.push(line);
  }
}

export async function createOrder(req: Request, res: Response) {
  const body = createOrderSchema.parse(req.body);
  const uid = userId(req);

  const user = await User.findById(uid);
  if (!user) throw new ApiError(401, 'Not authenticated');
  if (!user.isVerified) {
    throw new ApiError(403, 'Verify your email before checking out');
  }

  const cart = await Cart.findOne({ user: uid });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // Payment method must be available before we touch inventory.
  let provider;
  try {
    provider = getPaymentProvider(body.paymentMethod);
  } catch {
    throw new ApiError(400, `Payment method "${body.paymentMethod}" is not available yet`);
  }

  // Server rebuilds every line from live Product data — cart prices are
  // display-only and never trusted at checkout (§7).
  const lines: ResolvedLine[] = [];
  for (const item of cart.items) {
    const product = await Product.findOne({ _id: item.product, isActive: true });
    const variant = product?.variants.find((v) => v.sku === item.variantSku);
    if (!product || !variant) {
      throw new ApiError(409, `No longer available: ${item.variantSku}`);
    }
    lines.push({
      productId: product._id.toString(),
      title: product.title,
      sku: variant.sku,
      qty: item.qty,
      unitPricePaisa: variant.priceOverridePaisa ?? product.salePricePaisa ?? product.basePricePaisa,
    });
  }

  await decrementStockOrThrow(lines);

  const subtotalPaisa = lines.reduce((sum, line) => sum + line.qty * line.unitPricePaisa, 0);
  const shippingPaisa = calculateShippingPaisa(subtotalPaisa);
  const totalPaisa = subtotalPaisa + shippingPaisa;

  const order = await Order.create({
    orderNumber: await nextOrderNumber(),
    user: uid,
    items: lines.map((line) => ({
      product: line.productId,
      title: line.title,
      variantSku: line.sku,
      qty: line.qty,
      unitPricePaisa: line.unitPricePaisa,
    })),
    shippingAddress: body.shippingAddress,
    subtotalPaisa,
    shippingPaisa,
    totalPaisa,
    paymentMethod: body.paymentMethod,
    paymentProvider: body.paymentMethod,
  });

  const { ref, redirectUrl } = await provider.createPaymentIntent(order);
  order.paymentRef = ref;
  await order.save();

  // COD is committed immediately, so its cart clears now. A gateway order's
  // cart stays intact until the webhook confirms payment (§5) — otherwise a
  // failed/abandoned payment would strand the user with an empty cart.
  if (body.paymentMethod === 'cod') {
    cart.items.splice(0, cart.items.length);
    await cart.save();
  }

  res.status(201).json({ order, redirectUrl });
}

export async function listOrders(req: Request, res: Response) {
  const orders = await Order.find({ user: userId(req) }).sort({ createdAt: -1 });
  res.json({ orders });
}

export async function getOrder(req: Request, res: Response) {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber, user: userId(req) });
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ order });
}
