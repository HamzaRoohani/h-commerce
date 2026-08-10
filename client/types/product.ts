export type ProductVariant = {
  size: string | null;
  color: string | null;
  sku: string;
  stock: number;
  priceOverridePaisa: number | null;
};

export type ProductCategoryRef = {
  _id: string;
  name: string;
  slug: string;
};

export type Product = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: ProductCategoryRef;
  basePricePaisa: number;
  salePricePaisa: number | null;
  currency: 'PKR';
  images: string[];
  variants: ProductVariant[];
  tags: string[];
  rating: { avg: number; count: number };
  isActive: boolean;
  isNewIn: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
