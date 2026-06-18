import type { CartItem } from '@/types/cart';
import { getCartItemStoreId } from '@/lib/checkout/cart-validation';
import { hasServiceBookingMetadata } from '@/lib/cart/service-cart-policy';

export function resolveIncomingCartStoreId(
  metadata?: Record<string, unknown> | null,
  productStoreId?: string | null
): string | null {
  const fromMeta = getCartItemStoreId({
    product_id: '',
    product_type: 'physical',
    quantity: 1,
    unit_price: 0,
    metadata: metadata ?? undefined,
  } as CartItem);

  if (fromMeta) return fromMeta;
  return productStoreId && productStoreId.length > 0 ? productStoreId : null;
}

/**
 * Vérifie qu'un ajout au panier respecte les règles du panier mixte service + produits.
 */
export function assertCompatibleCartAddition(
  existingItems: CartItem[],
  incoming: {
    product_type: string;
    metadata?: Record<string, unknown> | null;
    storeId?: string | null;
  }
): void {
  if (existingItems.length === 0) {
    return;
  }

  const incomingStoreId = resolveIncomingCartStoreId(incoming.metadata, incoming.storeId);
  const existingStoreIds = existingItems
    .map(getCartItemStoreId)
    .filter((id): id is string => Boolean(id));

  const hasBookedService = existingItems.some(
    item => item.product_type === 'service' && hasServiceBookingMetadata(item.metadata)
  );
  const incomingIsBookedService =
    incoming.product_type === 'service' && hasServiceBookingMetadata(incoming.metadata);

  if (!hasBookedService && !incomingIsBookedService) {
    return;
  }

  const storeIds = new Set(existingStoreIds);
  if (incomingStoreId) {
    storeIds.add(incomingStoreId);
  }

  if (storeIds.size > 1) {
    throw new Error(
      'Les services réservés ne peuvent être combinés qu’avec des produits de la même boutique. Retirez les articles des autres vendeurs.'
    );
  }

  if (hasBookedService && incoming.product_type === 'service' && incomingIsBookedService) {
    throw new Error(
      'Une seule réservation de service par panier mixte. Finalisez le paiement ou retirez le service existant.'
    );
  }
}
