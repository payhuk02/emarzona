/**
 * Checkout canonique mono-produit : `/checkout?productId=…&storeId=…`
 */

export type CheckoutMode = 'buy_now' | 'auction' | 'invalid';

export interface CheckoutRouteParams {
  productId?: string;
  storeId?: string;
  variantId?: string;
  auctionId?: string;
  buyNow?: boolean;
  quantity?: number;
  /** ISO 8601 — réservation service avant paiement */
  scheduledAt?: string;
  participants?: number;
  bookingId?: string;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
}

export function resolveCheckoutMode(searchParams: URLSearchParams): CheckoutMode {
  const auction = searchParams.get('auction');
  const productId = searchParams.get('productId');
  const buyNow = searchParams.get('buy_now') === 'true';

  if (auction) return 'auction';
  if (productId || buyNow) return 'buy_now';
  return 'invalid';
}

/** URL canonique pour achat direct d'un seul produit. */
export function buildCheckoutUrl(params: CheckoutRouteParams = {}): string {
  const sp = new URLSearchParams();

  if (params.productId) sp.set('productId', params.productId);
  if (params.storeId) sp.set('storeId', params.storeId);
  if (params.variantId) sp.set('variantId', params.variantId);
  if (params.auctionId) sp.set('auction', params.auctionId);
  if (params.buyNow) sp.set('buy_now', 'true');
  if (params.quantity != null && params.quantity > 1) {
    sp.set('quantity', String(params.quantity));
  }
  if (params.scheduledAt) sp.set('scheduledAt', params.scheduledAt);
  if (params.participants != null && params.participants > 1) {
    sp.set('participants', String(params.participants));
  }
  if (params.bookingId) sp.set('bookingId', params.bookingId);
  if (params.guestEmail) sp.set('guestEmail', params.guestEmail);
  if (params.guestName) sp.set('guestName', params.guestName);
  if (params.guestPhone) sp.set('guestPhone', params.guestPhone);

  const qs = sp.toString();
  if (!qs) return '/marketplace';
  return `/checkout?${qs}`;
}

/** Chemins legacy → redirection. */
export const CHECKOUT_LEGACY_REDIRECTS: Record<string, string> = {
  '/checkout/cart': '/marketplace',
  '/cart/checkout': '/marketplace',
  '/cart': '/marketplace',
  '/cart-old': '/marketplace',
  '/checkout/multi-store-tracking': '/account/orders',
};
