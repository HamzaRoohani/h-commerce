import { z } from 'zod';

export const adminUpdateOrderSchema = z
  .object({
    orderStatus: z.enum(['processing', 'shipped', 'delivered', 'cancelled']).optional(),
    paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  })
  .refine((body) => body.orderStatus !== undefined || body.paymentStatus !== undefined, {
    message: 'Provide orderStatus and/or paymentStatus',
  });
