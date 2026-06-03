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

function hasServiceBookingMeta(item: CartItem): boolean {
  const meta = item.metadata;
  if (!meta || typeof meta !== 'object') return false;
  return Boolean(
    meta.booking_id || meta.scheduled_at || meta.service_booking_id || meta.booking_date
  );
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
