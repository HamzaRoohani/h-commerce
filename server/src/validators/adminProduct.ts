import { z } from 'zod';

const variantInputSchema = z.object({
  size: z.string().trim().min(1).nullable().optional(),
  color: z.string().trim().min(1).nullable().optional(),
  sku: z.string().trim().min(1),
  stock: z.coerce.number().int().min(0),
  priceOverridePaisa: z.coerce.number().int().min(0).nullable().optional(),
});

const baseProductFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().default(''),
  category: z.string().length(24, 'Invalid category id'),
  basePricePaisa: z.coerce.number().int().min(0),
  salePricePaisa: z.coerce.number().int().min(0).nullable().optional(),
  images: z.array(z.string().trim().url()).default([]),
  variants: z.array(variantInputSchema).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().default(true),
  isNewIn: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
};

export const createProductSchema = z.object({
  ...baseProductFields,
  // Auto-derived from title when omitted — see slugify() in the controller.
  slug: z.string().trim().min(1).optional(),
});

export const updateProductSchema = z
  .object({ ...baseProductFields, slug: z.string().trim().min(1) })
  .partial();
