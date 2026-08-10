import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    name: z.string().trim().min(1),
    street: z.string().trim().min(1),
    city: z.string().trim().min(1),
    country: z.string().trim().min(1).default('Pakistan'),
    phone: z.string().trim().min(1),
  }),
  paymentMethod: z.enum(['cod', 'gateway']),
});
