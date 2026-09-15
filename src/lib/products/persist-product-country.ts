import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Persist country of origin on products (+ physical_products when applicable).
 * Physical create RPC already inserts physical.country_of_origin (trigger syncs products);
 * update_physical_product_tx historically omits the column — this closes that gap.
 */
export async function persistProductCountryOfOrigin(
  productId: string,
  countryCode: string | null | undefined,
  options?: { syncPhysical?: boolean }
): Promise<void> {
  const code = countryCode?.trim() || null;

  const { error: productError } = await supabase
    .from('products')
    .update({ country_of_origin: code } as Record<string, unknown>)
    .eq('id', productId);

  if (productError) {
    logger.error('Failed to persist products.country_of_origin', {
      error: productError.message,
      productId,
    });
    throw productError;
  }

  if (options?.syncPhysical) {
    const { error: physicalError } = await supabase
      .from('physical_products')
      .update({ country_of_origin: code })
      .eq('product_id', productId);

    if (physicalError) {
      logger.error('Failed to persist physical_products.country_of_origin', {
        error: physicalError.message,
        productId,
      });
      throw physicalError;
    }
  }
}
