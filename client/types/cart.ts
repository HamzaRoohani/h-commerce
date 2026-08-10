export type CartItem = {
  productId: string;
  variantSku: string;
  qty: number;
  priceAtAddPaisa: number;
  title: string;
  slug: string | null;
  image: string | null;
  size: string | null;
  stock: number;
  currentPricePaisa: number | null;
};

export type CartResponse = {
  items: CartItem[];
  subtotalPaisa: number;
};
