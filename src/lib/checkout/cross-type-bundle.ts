/**
 * Bundles cross-type — expansion panier → lignes checkout multi-verticales.
 */

import type { CartItem, ProductType } from '@/types/cart';
import { fetchCrossTypeBundleLines } from '@/lib/bundles/cross-type-bundle-store';

export type CrossTypeBundleLine = {
  product_id: string;
  product_type: ProductType;
  product_name: string;
  quantity: number;
  list_price: number;
  variant_id?: string | null;
  metadata?: Record<string, unknown>;
};

function cartMeta(item: CartItem): Record<string, unknown> {
  if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
    return item.metadata as Record<string, unknown>;
  }
  return {};
}

export function isCrossTypeBundleCartItem(item: CartItem): boolean {
  const meta = cartMeta(item);
  if (meta.is_cross_type_bundle === true) return true;
  if (typeof meta.cross_type_bundle_id === 'string' && meta.cross_type_bundle_id.length > 0) {
    return true;
  }
  return Array.isArray(meta.bundle_lines) && meta.bundle_lines.length > 0;
}

export function getCrossTypeBundleLinesFromMetadata(item: CartItem): CrossTypeBundleLine[] | null {
  const raw = cartMeta(item).bundle_lines;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  return raw.map(line => {
    const row = line as Record<string, unknown>;
    return {
      product_id: String(row.product_id),
      product_type: row.product_type as ProductType,
      product_name: String(row.product_name ?? row.product_id),
      quantity: Number(row.quantity ?? 1),
      list_price: Number(row.list_price ?? 0),
      variant_id: row.variant_id != null ? String(row.variant_id) : null,
      metadata:
        row.metadata && typeof row.metadata === 'object'
          ? (row.metadata as Record<string, unknown>)
          : undefined,
    };
  });
}

export function validateCrossTypeBundleLines(lines: CrossTypeBundleLine[]): {
  ok: boolean;
  message?: string;
} {
  if (lines.length < 2) {
    return { ok: false, message: 'Un bundle cross-type requiert au moins 2 produits.' };
  }

  const types = new Set(lines.map(l => l.product_type));
  if (types.size < 2) {
    return {
      ok: false,
      message: 'Un bundle cross-type requiert au moins 2 types de produits différents.',
    };
  }

  return { ok: true };
}

/** Répartit le prix bundle proportionnellement aux prix catalogue. */
export function allocateBundlePrice(
  lines: CrossTypeBundleLine[],
  bundleTotal: number
): Array<CrossTypeBundleLine & { unit_price: number }> {
  const safeTotal = Math.max(0, bundleTotal);
  const listSum = lines.reduce((sum, line) => sum + line.list_price * line.quantity, 0);

  if (listSum <= 0) {
    const perLine = lines.length > 0 ? safeTotal / lines.length : 0;
    return lines.map(line => ({
      ...line,
      unit_price: line.quantity > 0 ? perLine / line.quantity : 0,
    }));
  }

  return lines.map(line => {
    const weight = (line.list_price * line.quantity) / listSum;
    const lineTotal = safeTotal * weight;
    return {
      ...line,
      unit_price: line.quantity > 0 ? lineTotal / line.quantity : 0,
    };
  });
}

export function expandCrossTypeBundleItem(item: CartItem): CartItem[] {
  const lines = getCrossTypeBundleLinesFromMetadata(item);
  if (!lines?.length) return [item];

  const validation = validateCrossTypeBundleLines(lines);
  if (!validation.ok) {
    throw new Error(validation.message ?? 'Bundle cross-type invalide');
  }

  const meta = cartMeta(item);
  const bundleId = String(meta.cross_type_bundle_id ?? meta.bundle_id ?? item.product_id);
  const bundleTotal = item.unit_price * item.quantity;
  const priced = allocateBundlePrice(lines, bundleTotal);

  return priced.map(line => ({
    product_id: line.product_id,
    product_type: line.product_type,
    product_name: line.product_name,
    quantity: line.quantity,
    unit_price: line.unit_price,
    currency: item.currency,
    variant_id: line.variant_id ?? null,
    metadata: {
      ...line.metadata,
      store_id: meta.store_id,
      cross_type_bundle_id: bundleId,
      bundle_parent_name: item.product_name,
      from_cross_type_bundle: true,
    },
  }));
}

/** Déplie les lignes bundle avant validation checkout. */
export function expandCheckoutCart(items: CartItem[]): CartItem[] {
  const expanded: CartItem[] = [];

  for (const item of items) {
    if (isCrossTypeBundleCartItem(item) && getCrossTypeBundleLinesFromMetadata(item)) {
      expanded.push(...expandCrossTypeBundleItem(item));
    } else {
      expanded.push(item);
    }
  }

  return expanded;
}

export function countCrossTypeBundlesInCart(items: CartItem[]): number {
  return items.filter(isCrossTypeBundleCartItem).length;
}

/** Déplie les bundles (metadata inline ou chargement DB via bundle_id). */
export async function expandCheckoutCartAsync(items: CartItem[]): Promise<CartItem[]> {
  const expanded: CartItem[] = [];

  for (const item of items) {
    if (!isCrossTypeBundleCartItem(item)) {
      expanded.push(item);
      continue;
    }

    let lines = getCrossTypeBundleLinesFromMetadata(item);
    if (!lines?.length) {
      const bundleId = String(
        cartMeta(item).cross_type_bundle_id ?? cartMeta(item).bundle_id ?? item.product_id
      );
      lines = await fetchCrossTypeBundleLines(bundleId);
    }

    if (lines.length > 0) {
      expanded.push(
        ...expandCrossTypeBundleItem({
          ...item,
          metadata: { ...cartMeta(item), bundle_lines: lines },
        })
      );
      continue;
    }

    expanded.push(item);
  }

  return expanded;
}
