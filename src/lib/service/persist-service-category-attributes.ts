import { supabase } from '@/integrations/supabase/client';
import type { ServiceCategoryAttributes } from '@/lib/services/service-form-profiles';
import { logger } from '@/lib/logger';

export async function persistServiceCategoryAttributes(
  serviceProductId: string | null | undefined,
  attributes: ServiceCategoryAttributes | undefined,
  productId?: string | null
): Promise<void> {
  let id = serviceProductId ?? null;
  if (!id && productId) {
    const { data, error } = await supabase
      .from('service_products')
      .select('id')
      .eq('product_id', productId)
      .maybeSingle();
    if (error) {
      logger.error('persistServiceCategoryAttributes lookup failed', { error, productId });
      throw new Error('Impossible d’enregistrer les spécificités de catégorie');
    }
    id = data?.id ?? null;
  }
  if (!id) {
    logger.error('persistServiceCategoryAttributes skipped: missing service product id', {
      productId,
    });
    throw new Error('Impossible d’enregistrer les spécificités de catégorie');
  }
  const { error } = await supabase
    .from('service_products')
    .update({ category_attributes: attributes && Object.keys(attributes).length ? attributes : {} })
    .eq('id', id);
  if (error) {
    logger.error('persistServiceCategoryAttributes failed', { error, serviceProductId: id });
    throw new Error('Impossible d’enregistrer les spécificités de catégorie');
  }
}
