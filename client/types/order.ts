export type OrderItem = {
  product: string;
  title: string;
  variantSku: string;
  qty: number;
  unitPricePaisa: number;
};

export type ShippingAddress = {
  name: string;
  street: string;
  city: string;
  country: string;
  phone: string;
};

export type Order = {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotalPaisa: number;
  shippingPaisa: number;
  totalPaisa: number;
  paymentMethod: 'cod' | 'gateway';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentRef: string | null;
  paymentProvider: string | null;
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};
