/**
 * Réservation d'éditions limitées (checkout panier + commande directe).
 * RPC check_and_increment_artist_product_version : compte pending+paid+completed, sans bump version.
 * La version artist_products est incrémentée côté DB au paiement confirmé (trigger SQL).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/types/cart';

type EditionLockResult = {
  success: boolean;
  current_version?: number;
  available_editions?: number;
  message?: string;
};

function parseLockResult(lockResult: unknown): EditionLockResult | null {
  if (lockResult == null) return null;
  return (Array.isArray(lockResult) ? lockResult[0] : lockResult) as EditionLockResult;
}

/**
 * Vérifie et réserve le stock pour une œuvre en édition limitée.
 * @throws Error si indisponible ou conflit de version
 */
export async function reserveArtistLimitedEdition(
  productId: string,
  quantity: number
): Promise<void> {
  if (quantity <= 0) return;

  const { data: artistProduct, error: artistError } = await supabase
    .from('artist_products')
    .select('artwork_edition_type, total_editions')
    .eq('product_id', productId)
    .single();

  if (artistError || !artistProduct) {
    throw new Error("Œuvre d'artiste non trouvée");
  }

  if (artistProduct.artwork_edition_type !== 'limited_edition' || !artistProduct.total_editions) {
    return;
  }

  const { data: lockResult, error: lockError } = await supabase.rpc(
    'check_and_increment_artist_product_version',
    {
      p_product_id: productId,
      p_expected_version: 0,
      p_quantity: quantity,
    }
  );

  if (lockError) {
    logger.error('Erreur optimistic locking édition limitée', {
      error: lockError,
      productId,
      quantity,
    });
    throw new Error('Erreur lors de la vérification de disponibilité');
  }

  const result = parseLockResult(lockResult);

  if (!result?.success) {
    throw new Error(
      result?.message || `Seulement ${result?.available_editions ?? 0} exemplaire(s) disponible(s)`
    );
  }

  logger.info('Édition limitée réservée', {
    productId,
    quantity,
    newVersion: result.current_version,
    available: result.available_editions,
  });
}

/**
 * Agrège les quantités par product_id et réserve chaque œuvre en édition limitée du panier.
 */
export async function reserveArtistLimitedEditionsForCart(items: CartItem[]): Promise<void> {
  const quantitiesByProduct = new Map<string, number>();

  for (const item of items) {
    if (item.product_type !== 'artist') continue;
    quantitiesByProduct.set(
      item.product_id,
      (quantitiesByProduct.get(item.product_id) ?? 0) + item.quantity
    );
  }

  for (const [productId, quantity] of quantitiesByProduct) {
    await reserveArtistLimitedEdition(productId, quantity);
  }
}
