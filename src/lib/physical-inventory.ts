/**
 * Réservation / libération stock produits physiques (checkout panier, buy-now).
 * La déduction finale est gérée par le trigger SQL fulfill_physical_inventory_on_order_paid.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/types/cart';

type PhysicalInventoryRpc = (
  fn: string,
  params: Record<string, unknown>
) => Promise<{ data: unknown; error: { message?: string; details?: string } | null }>;

const rpc = supabase.rpc.bind(supabase) as unknown as PhysicalInventoryRpc;

function parseRpcError(error: { message?: string; details?: string } | null): string {
  if (!error) return 'Erreur inventaire';
  return error.message || error.details || 'Erreur inventaire';
}

/** Réserve le stock pour toutes les lignes physical d'une commande. */
export async function reservePhysicalInventoryForOrder(orderId: string): Promise<void> {
  const { error } = await rpc('reserve_physical_inventory_for_order', {
    p_order_id: orderId,
  });

  if (error) {
    logger.error('reserve_physical_inventory_for_order failed', { orderId, error });
    throw new Error(parseRpcError(error));
  }
}

/** Libère les réservations si le paiement n'a pas abouti. */
export async function releasePhysicalInventoryForOrder(orderId: string): Promise<void> {
  const { error } = await rpc('release_physical_inventory_for_order', {
    p_order_id: orderId,
  });

  if (error) {
    logger.warn('release_physical_inventory_for_order failed', { orderId, error });
  }
}

/** True si le panier contient au moins un article physical. */
export function cartHasPhysicalItems(items: CartItem[]): boolean {
  return items.some(i => i.product_type === 'physical');
}

/**
 * Réserve le stock pour chaque commande créée (multi-boutiques).
 * En cas d'échec sur une commande, libère celles déjà réservées puis propage l'erreur.
 */
export async function reservePhysicalInventoryForOrders(orderIds: string[]): Promise<void> {
  const reserved: string[] = [];
  try {
    for (const orderId of orderIds) {
      await reservePhysicalInventoryForOrder(orderId);
      reserved.push(orderId);
    }
  } catch (err) {
    await Promise.all(reserved.map(id => releasePhysicalInventoryForOrder(id)));
    throw err;
  }
}
