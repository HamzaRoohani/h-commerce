import { create } from 'zustand';
import type { CartItem } from '@/types/cart';

type ServerCartState = {
  items: CartItem[];
  subtotalPaisa: number;
  loaded: boolean;
  setCart: (items: CartItem[], subtotalPaisa: number) => void;
  reset: () => void;
};

// Authenticated users only — server is authoritative, this just mirrors the
// latest API response for rendering (§7). Never persisted to localStorage.
export const useServerCartStore = create<ServerCartState>((set) => ({
  items: [],
  subtotalPaisa: 0,
  loaded: false,
  setCart: (items, subtotalPaisa) => set({ items, subtotalPaisa, loaded: true }),
  reset: () => set({ items: [], subtotalPaisa: 0, loaded: false }),
}));
