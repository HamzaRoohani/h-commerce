import { z } from 'zod';

export const listProductsQuerySchema = z.object({
  category: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  search: z.string().trim().min(1).optional(),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
