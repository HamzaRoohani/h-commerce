import { getCart, mergeCart } from './cart';
import { useGuestCartStore } from '@/store/guestCartStore';
import { useServerCartStore } from '@/store/serverCartStore';

/**
 * §7: on login/register, POST the local guest cart to /api/cart/merge and
 * replace it with the canonical (stock-capped) server response. If there
 * was no guest cart, just load whatever's already on the server (e.g. from
 * a previous session).
 */
export async function mergeGuestCartIntoServer(): Promise<void> {
  const guestItems = useGuestCartStore.getState().items;

  const cart =
    guestItems.length > 0
      ? await mergeCart(
          guestItems.map((item) => ({
            productId: item.productId,
            variantSku: item.variantSku,
            qty: item.qty,
          })),
        )
      : await getCart();

  useServerCartStore.getState().setCart(cart.items, cart.subtotalPaisa);
  if (guestItems.length > 0) useGuestCartStore.getState().clear();
}
