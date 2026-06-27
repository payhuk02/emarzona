/**
 * Adaptateur lecture/écriture inventaire — source canonique : physical_product_inventory.
 */

import type { InventoryItem } from '@/hooks/physical/useInventory';

export const PHYSICAL_PRODUCT_INVENTORY_SELECT = `
  id,
  physical_product_id,
  variant_id,
  store_id,
  quantity,
  quantity_available,
  quantity_reserved,
  reserved_quantity,
  location_name,
  warehouse_id,
  reorder_point,
  reorder_quantity,
  unit_cost,
  last_counted_at,
  created_at,
  updated_at,
  physical_product:physical_products (
    id,
    product:products (
      id,
      name,
      store_id
    )
  ),
  variant:physical_product_variants (
    id,
    sku,
    option1_value,
    option2_value,
    option3_value,
    physical_product:physical_products (
      product:products (
        id,
        name,
        store_id
      )
    )
  )
`;

type InventoryRow = {
  id: string;
  physical_product_id?: string | null;
  variant_id?: string | null;
  quantity?: number | null;
  quantity_available?: number | null;
  quantity_reserved?: number | null;
  reserved_quantity?: number | null;
  location_name?: string | null;
  reorder_point?: number | null;
  reorder_quantity?: number | null;
  unit_cost?: number | null;
  last_counted_at?: string | null;
  created_at: string;
  updated_at: string;
  variant?: {
    sku?: string | null;
    option1_value?: string | null;
    option2_value?: string | null;
    physical_product?: {
      product?: { name?: string; store_id?: string };
    };
  } | null;
  physical_product?: {
    product?: { name?: string; store_id?: string };
  } | null;
};

export function mapPhysicalProductInventoryRow(row: InventoryRow): InventoryItem {
  const rawAvailable = row.quantity_available ?? row.quantity ?? 0;
  const reserved = row.quantity_reserved ?? row.reserved_quantity ?? 0;
  const sellable = Math.max(0, rawAvailable - reserved);

  return {
    id: row.id,
    physical_product_id: row.physical_product_id ?? undefined,
    variant_id: row.variant_id ?? undefined,
    sku: row.variant?.sku ?? '',
    quantity_available: sellable,
    quantity_reserved: reserved,
    quantity_committed: 0,
    warehouse_location: row.location_name ?? undefined,
    bin_location: undefined,
    reorder_point: row.reorder_point ?? 0,
    reorder_quantity: row.reorder_quantity ?? 0,
    unit_cost: row.unit_cost ?? undefined,
    total_value: row.unit_cost != null ? sellable * Number(row.unit_cost) : undefined,
    last_counted_at: row.last_counted_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getInventoryRowStoreId(row: InventoryRow): string | undefined {
  return (
    row.physical_product?.product?.store_id ?? row.variant?.physical_product?.product?.store_id
  );
}

export function getInventoryRowProductName(row: InventoryRow): string {
  return (
    row.physical_product?.product?.name ?? row.variant?.physical_product?.product?.name ?? 'Unknown'
  );
}

export function getInventoryRowVariantLabel(row: InventoryRow): string {
  if (!row.variant) return '';
  const parts = [row.variant.option1_value, row.variant.option2_value].filter(Boolean);
  return parts.length > 0 ? ` (${parts.join(' / ')})` : '';
}
