/**
 * Résolution panier → lignes checkout (bundles cross-type + validation).
 */

import { validateCheckoutCart } from '@/lib/checkout/cart-validation';
import { expandCheckoutCart, expandCheckoutCartAsync } from '@/lib/checkout/cross-type-bundle';
import type { CartItem } from '@/types/cart';

export function resolveCheckoutCartItems(items: CartItem[]) {
  const expanded = expandCheckoutCart(items);
  const validation = validateCheckoutCart(expanded);
  return { expanded, validation };
}

export async function resolveCheckoutCartItemsAsync(items: CartItem[]) {
  const expanded = await expandCheckoutCartAsync(items);
  const validation = validateCheckoutCart(expanded);
  return { expanded, validation };
}
