import { create } from 'zustand';
import type { Product } from '@/types/product';

type WishlistState = {
  products: Product[];
  loaded: boolean;
  setWishlist: (products: Product[]) => void;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  reset: () => void;
};

// Auth-gated feature, no guest mode — mirrors the server, never persisted.
export const useWishlistStore = create<WishlistState>((set) => ({
  products: [],
  loaded: false,
  setWishlist: (products) => set({ products, loaded: true }),
  add: (product) => set((state) => ({ products: [...state.products, product] })),
  remove: (productId) =>
    set((state) => ({ products: state.products.filter((p) => p._id !== productId) })),
  reset: () => set({ products: [], loaded: false }),
}));
