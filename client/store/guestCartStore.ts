import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/cart';

type GuestCartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQty: (variantSku: string, qty: number) => void;
  removeItem: (variantSku: string) => void;
  clear: () => void;
};

// Guest cart only — logged-in users are server-authoritative (§7). Cart
// contents aren't sensitive (unlike tokens), so localStorage is fine here.
export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantSku === item.variantSku);
          if (existing) {
            const qty = Math.min(existing.qty + item.qty, item.stock);
            return {
              items: state.items.map((i) => (i.variantSku === item.variantSku ? { ...i, qty } : i)),
            };
          }
          return { items: [...state.items, item] };
        }),
      updateQty: (variantSku, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantSku === variantSku ? { ...i, qty: Math.min(qty, i.stock) } : i,
          ),
        })),
      removeItem: (variantSku) =>
        set((state) => ({ items: state.items.filter((i) => i.variantSku !== variantSku) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'h-guest-cart' },
  ),
);
