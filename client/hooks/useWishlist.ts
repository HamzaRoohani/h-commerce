import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { addToWishlist, removeFromWishlist } from '@/lib/wishlist';
import type { Product } from '@/types/product';

export function useWishlist() {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  const products = useWishlistStore((state) => state.products);
  const add = useWishlistStore((state) => state.add);
  const remove = useWishlistStore((state) => state.remove);

  const productIds = new Set(products.map((p) => p._id));

  async function toggle(product: Product) {
    if (!isAuthenticated) return false;

    if (productIds.has(product._id)) {
      remove(product._id);
      await removeFromWishlist(product._id).catch(() => add(product));
    } else {
      add(product);
      await addToWishlist(product._id).catch(() => remove(product._id));
    }
    return true;
  }

  return { products, productIds, isAuthenticated, toggle };
}
