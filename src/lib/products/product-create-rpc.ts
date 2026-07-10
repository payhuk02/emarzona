/**
 * Appels RPC transactionnels pour la création produit (Sprint 3).
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface ProductCreateRpcResult {
  success: boolean;
  product_id: string;
  digital_product_id?: string;
  service_product_id?: string;
  physical_product_id?: string;
  course_id?: string;
}

async function parseRpcResult(
  data: unknown,
  error: { message: string } | null
): Promise<ProductCreateRpcResult> {
  if (error) {
    logger.error('Product create RPC failed', { error });
    throw new Error(error.message || 'Erreur lors de la création du produit');
  }
  const row = data as ProductCreateRpcResult | null;
  if (!row?.product_id) {
    throw new Error('Réponse RPC invalide');
  }
  return row;
}

/** Types Supabase générés avant migration 20260621120000 */
const rpc = supabase.rpc.bind(supabase) as (
  fn: string,
  args: Record<string, unknown>
) => ReturnType<typeof supabase.rpc>;

export async function createArtistProductTx(
  storeId: string,
  product: Record<string, unknown>,
  artist: Record<string, unknown>
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('create_artist_product_tx', {
    p_store_id: storeId,
    p_product: product,
    p_artist: artist,
  });
  return parseRpcResult(data, error);
}

export async function createDigitalProductTx(
  storeId: string,
  product: Record<string, unknown>,
  digital: Record<string, unknown>,
  files: Record<string, unknown>[] = []
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('create_digital_product_tx', {
    p_store_id: storeId,
    p_product: product,
    p_digital: digital,
    p_files: files,
  });
  return parseRpcResult(data, error);
}

export async function createServiceProductTx(
  storeId: string,
  product: Record<string, unknown>,
  service: Record<string, unknown>,
  staff: Record<string, unknown>[] = [],
  slots: Record<string, unknown>[] = [],
  resources: Record<string, unknown>[] = []
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('create_service_product_tx', {
    p_store_id: storeId,
    p_product: product,
    p_service: service,
    p_staff: staff,
    p_slots: slots,
    p_resources: resources,
  });
  return parseRpcResult(data, error);
}

export async function createPhysicalProductTx(
  storeId: string,
  product: Record<string, unknown>,
  physical: Record<string, unknown>,
  variants: Record<string, unknown>[] = [],
  inventory: Record<string, unknown>[] = [],
  sizeChartId: string | null = null,
  affiliate: Record<string, unknown> | null = null
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('create_physical_product_tx', {
    p_store_id: storeId,
    p_product: product,
    p_physical: physical,
    p_variants: variants,
    p_inventory: inventory,
    p_size_chart_id: sizeChartId,
    p_affiliate: affiliate,
  });
  return parseRpcResult(data, error);
}
