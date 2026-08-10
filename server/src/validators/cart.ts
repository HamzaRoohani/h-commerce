import { z } from 'zod';

export const cartItemInputSchema = z.object({
  productId: z.string().length(24, 'Invalid product id'),
  variantSku: z.string().min(1),
  qty: z.coerce.number().int().min(1),
});

export const updateCartItemSchema = z.object({
  qty: z.coerce.number().int().min(1),
});

export const mergeCartSchema = z.object({
  items: z.array(cartItemInputSchema).max(100),
});
