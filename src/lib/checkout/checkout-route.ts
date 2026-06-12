/**
 * Epic 3.6 — Checkout canonique : une route `/checkout`, modes via query params.
 */

export type CheckoutMode = 'cart' | 'buy_now' | 'auction';

export interface CheckoutRouteParams {
  productId?: string;
  storeId?: string;
  variantId?: string;
  auctionId?: string;
  buyNow?: boolean;
  quantity?: number;
}

export function resolveCheckoutMode(searchParams: URLSearchParams): CheckoutMode {
  const auction = searchParams.get('auction');
  const buyNow = searchParams.get('buy_now') === 'true';
  const productId = searchParams.get('productId');

  if (auction) return 'auction';
  if (productId) return 'buy_now';
  if (buyNow) return 'buy_now';
  return 'cart';
}

/** URL canonique unique pour tout checkout acheteur. */
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

  const qs = sp.toString();
  return qs ? `/checkout?${qs}` : '/checkout';
}

/** Chemins legacy → redirection canonique. */
export const CHECKOUT_LEGACY_REDIRECTS: Record<string, string> = {
  '/checkout/cart': '/checkout',
  '/cart/checkout': '/checkout',
};
