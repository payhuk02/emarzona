/**
 * Validation stock produits physiques avant ajout / mise à jour panier.
 */

import { supabase } from '@/integrations/supabase/client';

export type PhysicalStockCheckResult = {
  available: boolean;
  availableQuantity?: number;
  reason?: string;
};

function parseStockCheckResult(data: unknown): PhysicalStockCheckResult {
  const row = (data ?? {}) as Record<string, unknown>;
  const availableQuantity =
    typeof row.available_quantity === 'number'
      ? row.available_quantity
      : typeof row.availableQuantity === 'number'
        ? row.availableQuantity
        : undefined;

  return {
    available: row.available === true,
    availableQuantity,
    reason: typeof row.reason === 'string' ? row.reason : undefined,
  };
}

export class PhysicalStockError extends Error {
  constructor(
    message: string,
    readonly availableQuantity?: number
  ) {
    super(message);
    this.name = 'PhysicalStockError';
  }
}

export async function checkPhysicalStockAvailability(
  productId: string,
  quantity: number,
  variantId?: string | null
): Promise<PhysicalStockCheckResult> {
  const { data, error } = await supabase.rpc('check_physical_stock_availability', {
    p_product_id: productId,
    p_variant_id: variantId ?? null,
    p_quantity: quantity,
  });

  if (error) {
    throw new Error(error.message || 'Impossible de vérifier le stock');
  }

  const result = parseStockCheckResult(data);
  if (data == null) {
    throw new Error('Impossible de vérifier le stock');
  }

  return result;
}

export async function assertPhysicalStockAvailable(
  productId: string,
  quantity: number,
  variantId?: string | null
): Promise<void> {
  const result = await checkPhysicalStockAvailability(productId, quantity, variantId);

  if (result.available) {
    return;
  }

  const availableQty = result.availableQuantity ?? 0;
  const message =
    availableQty > 0
      ? `Stock insuffisant : seulement ${availableQty} disponible(s)`
      : 'Produit en rupture de stock';

  throw new PhysicalStockError(message, availableQty);
}
