'use client';

import { useEffect } from 'react';
import { refreshRequest } from '@/lib/auth';
import { getCart } from '@/lib/cart';
import { getWishlist } from '@/lib/wishlist';
import { useAuthStore } from '@/store/authStore';
import { useServerCartStore } from '@/store/serverCartStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * Silent refresh on app boot (§6.4): the access token lives in memory, so a
 * hard reload always starts with none. Runs once before auth-dependent UI
 * (e.g. Header's account link, cart count) can rely on the stores being
 * settled. Also loads the server cart once a session is confirmed, since
 * it's authoritative for logged-in users (§7).
 */
export function AuthBootstrap() {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setServerCart = useServerCartStore((state) => state.setCart);
  const setWishlist = useWishlistStore((state) => state.setWishlist);

  useEffect(() => {
    let cancelled = false;

    refreshRequest()
      .then(({ accessToken, user }) => {
        if (cancelled) return;
        setSession(accessToken, user);
        return Promise.all([
          getCart().then((cart) => {
            if (!cancelled) setServerCart(cart.items, cart.subtotalPaisa);
          }),
          getWishlist().then((res) => {
            if (!cancelled) setWishlist(res.products);
          }),
        ]);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });

    return () => {
      cancelled = true;
    };
  }, [setSession, clearSession, setServerCart, setWishlist]);

  return null;
}
