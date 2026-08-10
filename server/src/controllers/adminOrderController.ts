import type { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { ApiError } from '../middleware/errorHandler.js';
import { adminUpdateOrderSchema } from '../validators/adminOrder.js';
import { restockOrderItems } from '../utils/restock.js';

export async function adminListOrders(req: Request, res: Response) {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '30'), 10) || 30));
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  const filter: Record<string, unknown> = status ? { orderStatus: status } : {};

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);

  res.json({ orders, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function adminUpdateOrder(req: Request, res: Response) {
  const body = adminUpdateOrderSchema.parse(req.body);

  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) throw new ApiError(404, 'Order not found');

  // paymentStatus for gateway orders only ever changes via the signature-
  // verified webhook (§5) — an admin manually flipping it would bypass
  // that guarantee. COD is fine: admin marking "paid" on delivery is the
  // documented lifecycle (§4).
  if (body.paymentStatus && order.paymentMethod === 'gateway') {
    throw new ApiError(400, 'Gateway order payment status can only change via the payment webhook');
  }

  const wasCancelled = order.orderStatus === 'cancelled';

  if (body.orderStatus) order.orderStatus = body.orderStatus;
  if (body.paymentStatus) order.paymentStatus = body.paymentStatus;
  await order.save();

  if (!wasCancelled && order.orderStatus === 'cancelled') {
    await restockOrderItems(order);
  }

  res.json({ order });
}
