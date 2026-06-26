import type { CartItem } from '@/types/cart';
import type { CrossTypeBundleLine } from '@/lib/checkout/cross-type-bundle';

/** Construit une ligne panier bundle cross-type (expansion au checkout). */
export function buildCrossTypeBundleCartItem(options: {
  bundleId: string;
  bundleName: string;
  bundlePrice: number;
  storeId: string;
  currency?: string;
  lines: CrossTypeBundleLine[];
}): CartItem {
  const { bundleId, bundleName, bundlePrice, storeId, lines, currency = 'XOF' } = options;

  return {
    product_id: bundleId,
    product_name: bundleName,
    product_type: 'digital',
    quantity: 1,
    unit_price: bundlePrice,
    currency,
    metadata: {
      store_id: storeId,
      is_cross_type_bundle: true,
      cross_type_bundle_id: bundleId,
      bundle_lines: lines,
    },
  };
}
