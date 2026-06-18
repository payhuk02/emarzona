/**
 * Helpers d'affichage produits physiques — alignés sur le schéma Supabase canonique.
 */

export type PhysicalInventoryRow = {
  variant_id?: string | null;
  quantity?: number | null;
  quantity_available?: number | null;
  available_quantity?: number | null;
  reserved_quantity?: number | null;
  quantity_reserved?: number | null;
};

export type PhysicalProductDimensions = {
  weight?: number | null;
  weight_unit?: string | null;
  weight_kg?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  dimensions_unit?: string | null;
};

function resolveSellableUnits(row: PhysicalInventoryRow): number {
  if (row.quantity_available != null) {
    return Math.max(0, Number(row.quantity_available));
  }
  if (row.available_quantity != null) {
    return Math.max(0, Number(row.available_quantity));
  }
  const total = Number(row.quantity ?? 0);
  const reserved = Number(row.reserved_quantity ?? row.quantity_reserved ?? 0);
  return Math.max(0, total - reserved);
}

/** Quantité vendable depuis physical_product_inventory (ou fallback product.stock). */
export function getPhysicalSellableQuantity(
  inventory: PhysicalInventoryRow[] | undefined | null,
  variantId?: string | null,
  productStockFallback?: number | null
): number {
  if (!inventory?.length) {
    return Math.max(0, Number(productStockFallback ?? 0));
  }

  const rows = variantId
    ? inventory.filter(row => row.variant_id === variantId)
    : inventory.filter(row => !row.variant_id);

  const target = rows.length > 0 ? rows : inventory;
  const total = target.reduce((sum, row) => sum + resolveSellableUnits(row), 0);

  if (total > 0) return total;
  return Math.max(0, Number(productStockFallback ?? 0));
}

export function formatPhysicalWeight(physical?: PhysicalProductDimensions | null): string | null {
  if (!physical) return null;
  if (physical.weight_kg != null && physical.weight_kg > 0) {
    return `${physical.weight_kg} kg`;
  }
  if (physical.weight != null && physical.weight > 0) {
    const unit = physical.weight_unit?.trim() || 'kg';
    return `${physical.weight} ${unit}`;
  }
  return null;
}

export function formatPhysicalDimensions(
  physical?: PhysicalProductDimensions | null
): string | null {
  if (!physical) return null;

  const length = physical.length_cm ?? physical.length;
  const width = physical.width_cm ?? physical.width;
  const height = physical.height_cm ?? physical.height;

  if (length == null && width == null && height == null) return null;

  const unit = physical.dimensions_unit?.trim() || 'cm';
  const parts = [length, width, height].filter(v => v != null && v > 0);
  if (!parts.length) return null;

  return `${parts.join(' × ')} ${unit}`;
}
