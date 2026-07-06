/**
 * Appels RPC transactionnels pour la mise à jour produit (Sprint 2–3).
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { ProductCreateRpcResult } from '@/lib/products/product-create-rpc';

async function parseRpcResult(
  data: unknown,
  error: { message: string } | null
): Promise<ProductCreateRpcResult> {
  if (error) {
    logger.error('Product update RPC failed', { error });
    throw new Error(error.message || 'Erreur lors de la mise à jour du produit');
  }
  const row = data as ProductCreateRpcResult | null;
  if (!row?.product_id) {
    throw new Error('Réponse RPC invalide');
  }
  return row;
}

const rpc = supabase.rpc.bind(supabase) as (
  fn: string,
  args: Record<string, unknown>
) => ReturnType<typeof supabase.rpc>;

export async function updatePhysicalProductTx(
  storeId: string,
  productId: string,
  product: Record<string, unknown>,
  physical: Record<string, unknown>
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('update_physical_product_tx', {
    p_store_id: storeId,
    p_product_id: productId,
    p_product: product,
    p_physical: physical,
  });
  return parseRpcResult(data, error);
}

export async function updateDigitalProductTx(
  storeId: string,
  productId: string,
  product: Record<string, unknown>,
  digital: Record<string, unknown>
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('update_digital_product_tx', {
    p_store_id: storeId,
    p_product_id: productId,
    p_product: product,
    p_digital: digital,
  });
  return parseRpcResult(data, error);
}

export async function updateServiceProductTx(
  storeId: string,
  productId: string,
  product: Record<string, unknown>,
  service: Record<string, unknown>
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('update_service_product_tx', {
    p_store_id: storeId,
    p_product_id: productId,
    p_product: product,
    p_service: service,
  });
  return parseRpcResult(data, error);
}

export async function updateArtistProductTx(
  storeId: string,
  productId: string,
  product: Record<string, unknown>,
  artist: Record<string, unknown>
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('update_artist_product_tx', {
    p_store_id: storeId,
    p_product_id: productId,
    p_product: product,
    p_artist: artist,
  });
  return parseRpcResult(data, error);
}

export interface UpdateFullCourseParams {
  storeId: string;
  productId: string;
  product: Record<string, unknown>;
  course: Record<string, unknown>;
  sections: Record<string, unknown>[];
  affiliate?: Record<string, unknown> | null;
  tracking?: Record<string, unknown> | null;
}

export async function updateFullCourseTx(
  params: UpdateFullCourseParams
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('update_full_course_tx', {
    p_store_id: params.storeId,
    p_product_id: params.productId,
    p_product: params.product,
    p_course: params.course,
    p_sections: params.sections,
    p_affiliate: params.affiliate ?? null,
    p_tracking: params.tracking ?? null,
  });
  return parseRpcResult(data, error);
}
