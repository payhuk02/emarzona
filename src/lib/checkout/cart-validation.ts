/**
 * Validation panier avant checkout unifié.
 */

import type { CartItem } from '@/types/cart';

export interface CheckoutCartValidation {
  canCheckout: boolean;
  checkoutItems: CartItem[];
  serviceOnly: boolean;
  hasMixedWithService: boolean;
  message?: string;
}

function cartMetadata(item: CartItem): Record<string, unknown> {
  if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
    return item.metadata as Record<string, unknown>;
  }
  return {};
}

/** store_id porté par metadata panier (PhysicalProductDetail, ServiceDetail, etc.). */
export function getCartItemStoreId(item: CartItem): string | null {
  const meta = cartMetadata(item);
  const storeId = meta.store_id ?? meta.storeId;
  return typeof storeId === 'string' && storeId.length > 0 ? storeId : null;
}

function hasServiceBookingMeta(item: CartItem): boolean {
  const meta = cartMetadata(item);
  return Boolean(
    meta.booking_id || meta.scheduled_at || meta.service_booking_id || meta.booking_date
  );
}

function validateSameStore(items: CartItem[]): { ok: boolean; message?: string } {
  const storeIds = items.map(getCartItemStoreId).filter((id): id is string => Boolean(id));
  if (storeIds.length <= 1) return { ok: true };

  const unique = new Set(storeIds);
  if (unique.size === 1) return { ok: true };

  return {
    ok: false,
    message:
      'Les services ne peuvent être payés qu’avec d’autres produits de la même boutique. Retirez les articles des autres vendeurs.',
  };
}

export function validateCheckoutCart(items: CartItem[]): CheckoutCartValidation {
  const serviceItems = items.filter(i => i.product_type === 'service');
  const nonServiceItems = items.filter(i => i.product_type !== 'service');

  if (serviceItems.length === 0) {
    return {
      canCheckout: true,
      checkoutItems: items,
      serviceOnly: false,
      hasMixedWithService: false,
    };
  }

  if (nonServiceItems.length === 0) {
    return {
      canCheckout: false,
      checkoutItems: [],
      serviceOnly: true,
      hasMixedWithService: false,
      message:
        'Les services se réservent depuis la fiche du service (créneau et prestataire), pas via le panier général.',
    };
  }

  const bookedServices = serviceItems.filter(hasServiceBookingMeta);
  if (bookedServices.length === serviceItems.length) {
    const sameStore = validateSameStore(items);
    if (!sameStore.ok) {
      return {
        canCheckout: false,
        checkoutItems: nonServiceItems,
        serviceOnly: false,
        hasMixedWithService: true,
        message: sameStore.message,
      };
    }

    return {
      canCheckout: true,
      checkoutItems: items,
      serviceOnly: false,
      hasMixedWithService: true,
    };
  }

  return {
    canCheckout: false,
    checkoutItems: nonServiceItems,
    serviceOnly: false,
    hasMixedWithService: true,
    message:
      'Votre panier contient des services sans réservation. Finalisez la réservation sur chaque fiche service, ou retirez les services pour payer les autres articles.',
  };
}
