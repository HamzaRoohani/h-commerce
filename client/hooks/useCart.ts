import { useAuthStore } from '@/store/authStore';
import { useGuestCartStore } from '@/store/guestCartStore';
import { useServerCartStore } from '@/store/serverCartStore';
import { addCartItem, removeCartItem, updateCartItem } from '@/lib/cart';
import type { CartItem } from '@/types/cart';

/**
 * Unifies guest (local, Zustand+persist) and server (authoritative once
 * logged in) carts behind one interface (§7). Components don't need to
 * know which mode is active.
 */
export function useCart() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';

  const guestItems = useGuestCartStore((state) => state.items);
  const guestAdd = useGuestCartStore((state) => state.addItem);
  const guestUpdateQty = useGuestCartStore((state) => state.updateQty);
  const guestRemove = useGuestCartStore((state) => state.removeItem);

  const serverItems = useServerCartStore((state) => state.items);
  const serverSubtotal = useServerCartStore((state) => state.subtotalPaisa);
  const setServerCart = useServerCartStore((state) => state.setCart);

  const items = isAuthenticated ? serverItems : guestItems;
  const subtotalPaisa = isAuthenticated
    ? serverSubtotal
    : guestItems.reduce((sum, i) => sum + i.qty * (i.currentPricePaisa ?? i.priceAtAddPaisa), 0);
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);

  async function addItem(item: CartItem) {
    if (isAuthenticated) {
      const cart = await addCartItem({
        productId: item.productId,
        variantSku: item.variantSku,
        qty: item.qty,
      });
      setServerCart(cart.items, cart.subtotalPaisa);
    } else {
      guestAdd(item);
    }
  }

  async function updateQty(variantSku: string, qty: number) {
    if (isAuthenticated) {
      const cart = await updateCartItem(variantSku, qty);
      setServerCart(cart.items, cart.subtotalPaisa);
    } else {
      guestUpdateQty(variantSku, qty);
    }
  }

  async function removeItem(variantSku: string) {
    if (isAuthenticated) {
      const cart = await removeCartItem(variantSku);
      setServerCart(cart.items, cart.subtotalPaisa);
    } else {
      guestRemove(variantSku);
    }
  }

  return { items, subtotalPaisa, itemCount, addItem, updateQty, removeItem };
}
