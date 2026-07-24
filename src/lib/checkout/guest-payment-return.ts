/**
 * URLs de retour paiement et chemins espace client pour achats invités.
 */

export type GuestPurchasableProductType =
  | 'digital'
  | 'service'
  | 'course'
  | 'artist'
  | 'physical'
  | 'generic';

export function resolveCustomerPortalPath(productType?: string | null): string {
  switch (productType) {
    case 'digital':
      // Achats digitaux (licences / fichiers), pas l'historique de downloads
      return '/account/digital';
    case 'course':
      return '/account/courses';
    case 'service':
      return '/account/bookings';
    case 'artist':
      return '/account/artist';
    case 'physical':
      return '/account/physical';
    default:
      return '/account/orders';
  }
}

export type BuildPaymentSuccessReturnUrlInput = {
  orderId: string;
  transactionId?: string;
  guestEmail?: string;
  productType?: string | null;
  guest?: boolean;
};

export function buildPaymentSuccessReturnUrl(
  input: BuildPaymentSuccessReturnUrlInput,
  origin?: string
): string {
  const base =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com');
  const url = new URL('/payment/success', base);
  url.searchParams.set('order_id', input.orderId);
  if (input.guest) {
    url.searchParams.set('guest', '1');
  }
  if (input.guestEmail?.trim()) {
    url.searchParams.set('email', input.guestEmail.trim());
  }
  if (input.productType) {
    url.searchParams.set('product_type', input.productType);
  }
  if (input.transactionId) {
    url.searchParams.set('transaction_id', input.transactionId);
  }
  return url.toString();
}

export function buildPaymentCancelReturnUrl(orderId: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com');
  const url = new URL('/payment/cancel', base);
  url.searchParams.set('order_id', orderId);
  return url.toString();
}
