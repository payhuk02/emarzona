import type {
  MovementDirection,
  MovementType,
  StockMovement,
} from '@/components/physical/StockMovementHistory';

type InventoryItemRow = {
  id: string;
  sku?: string | null;
  physical_product?: {
    id: string;
    product_id: string;
    product?: { name?: string | null; store_id?: string | null } | null;
  } | null;
  variant?: {
    id: string;
    option1_value?: string | null;
    option2_value?: string | null;
  } | null;
};

type DbStockMovement = {
  id: string;
  inventory_item_id: string;
  movement_type: string;
  quantity: number;
  order_id?: string | null;
  user_id?: string | null;
  reason?: string | null;
  notes?: string | null;
  movement_date?: string | null;
  created_at?: string | null;
};

function normalizeMovementType(raw: string): MovementType {
  const types: MovementType[] = [
    'purchase',
    'sale',
    'return',
    'adjustment',
    'transfer',
    'damage',
    'theft',
  ];
  if (types.includes(raw as MovementType)) return raw as MovementType;
  if (raw === 'recount') return 'adjustment';
  return 'adjustment';
}

function movementDirection(type: MovementType, quantity: number): MovementDirection {
  if (type === 'sale' || type === 'damage' || type === 'theft') return 'out';
  if (type === 'purchase' || type === 'return') return 'in';
  return quantity >= 0 ? 'in' : 'out';
}

function variantLabel(variant?: InventoryItemRow['variant']): string | undefined {
  if (!variant) return undefined;
  return [variant.option1_value, variant.option2_value].filter(Boolean).join(' / ') || undefined;
}

export function mapDbStockMovementToUi(
  movement: DbStockMovement,
  item?: InventoryItemRow
): StockMovement {
  const type = normalizeMovementType(movement.movement_type);
  const direction = movementDirection(type, movement.quantity);
  const qty = Math.abs(movement.quantity);

  return {
    id: movement.id,
    product_id:
      item?.physical_product?.product_id ??
      item?.physical_product?.id ??
      movement.inventory_item_id,
    product_name: item?.physical_product?.product?.name ?? 'Produit',
    variant_id: item?.variant?.id,
    variant_label: variantLabel(item?.variant),
    sku: item?.sku ?? undefined,
    type,
    direction,
    quantity: qty,
    quantity_before: 0,
    quantity_after: 0,
    reason: movement.reason ?? movement.notes ?? undefined,
    reference_id: movement.order_id ?? undefined,
    reference_type: movement.order_id ? 'order' : 'manual',
    user_id: movement.user_id ?? undefined,
    created_at: movement.movement_date ?? movement.created_at ?? new Date().toISOString(),
  };
}

export type { InventoryItemRow, DbStockMovement };
