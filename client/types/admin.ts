import type { ProductVariant } from './product';

export type AdminProductInput = {
  title: string;
  description?: string;
  category: string;
  basePricePaisa: number;
  salePricePaisa?: number | null;
  images: string[];
  variants: ProductVariant[];
  tags?: string[];
  isActive?: boolean;
  isNewIn?: boolean;
  isFeatured?: boolean;
  slug?: string;
};
