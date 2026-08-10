'use client';

import { useCart } from '@/hooks/useCart';
import { useCartUiStore } from '@/store/cartUiStore';

export function CartTrigger() {
  const { itemCount } = useCart();
  const open = useCartUiStore((state) => state.open);

  return (
    <button type="button" onClick={open} aria-label="Cart">
      Cart{itemCount > 0 ? ` (${itemCount})` : ''}
    </button>
  );
}
