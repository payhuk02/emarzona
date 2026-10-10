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

const fromTable = (table: string) =>
  (supabase.from as (t: string) => ReturnType<typeof supabase.from>)(table);

function isMissingRpcSignatureError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('could not find the function') ||
    m.includes('schema cache') ||
    (m.includes('function') && m.includes('does not exist'))
  );
}

/** Fallback when RPC lacks p_affiliate: upsert product_affiliate_settings directly. */
async function syncProductAffiliateSettings(
  storeId: string,
  productId: string,
  affiliate: Record<string, unknown> | null
): Promise<void> {
  if (affiliate == null) return;

  const enabled = Boolean(affiliate.enabled ?? affiliate.affiliate_enabled ?? false);

  await fromTable('product_affiliate_settings').delete().eq('product_id', productId);

  if (!enabled) return;

  const { error } = await fromTable('product_affiliate_settings').insert({
    product_id: productId,
    store_id: storeId,
    affiliate_enabled: true,
    commission_rate: Number(affiliate.commission_rate ?? 20),
    commission_type: String(affiliate.commission_type ?? 'percentage'),
    fixed_commission_amount: Number(affiliate.fixed_commission_amount ?? 0),
    cookie_duration_days: Number(affiliate.cookie_duration_days ?? 30),
    min_order_amount: Number(affiliate.min_order_amount ?? 0),
    allow_self_referral: Boolean(affiliate.allow_self_referral ?? false),
    require_approval: Boolean(affiliate.require_approval ?? false),
    terms_and_conditions: String(affiliate.terms_and_conditions ?? ''),
  });
  if (error) {
    logger.error('Affiliate settings sync failed after RPC fallback', { error });
    throw new Error(error.message || "Impossible d'enregistrer l'affiliation");
  }
}

export async function updatePhysicalProductTx(
  storeId: string,
  productId: string,
  product: Record<string, unknown>,
  physical: Record<string, unknown>,
  variants: Record<string, unknown>[] = [],
  inventory: Record<string, unknown>[] = [],
  sizeChartId: string | null = null,
  affiliate: Record<string, unknown> | null = null
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('update_physical_product_tx', {
    p_store_id: storeId,
    p_product_id: productId,
    p_product: product,
    p_physical: physical,
    p_variants: variants,
    p_inventory: inventory,
    p_size_chart_id: sizeChartId,
    p_affiliate: affiliate,
  });
  return parseRpcResult(data, error);
}

export async function updateDigitalProductTx(
  storeId: string,
  productId: string,
  product: Record<string, unknown>,
  digital: Record<string, unknown>,
  files: Record<string, unknown>[] | null = null,
  affiliate: Record<string, unknown> | null = null
): Promise<ProductCreateRpcResult> {
  const argsWithAffiliate = {
    p_store_id: storeId,
    p_product_id: productId,
    p_product: product,
    p_digital: digital,
    p_files: files,
    p_affiliate: affiliate,
  };

  const { data, error } = await rpc('update_digital_product_tx', argsWithAffiliate);

  if (error && isMissingRpcSignatureError(error.message) && error.message.includes('p_affiliate')) {
    logger.warn(
      'update_digital_product_tx missing p_affiliate — retrying without + sync affiliate',
      {
        message: error.message,
      }
    );
    const { data: data2, error: error2 } = await rpc('update_digital_product_tx', {
      p_store_id: storeId,
      p_product_id: productId,
      p_product: product,
      p_digital: digital,
      p_files: files,
    });
    const result = await parseRpcResult(data2, error2);
    await syncProductAffiliateSettings(storeId, productId, affiliate);
    return result;
  }

  return parseRpcResult(data, error);
}

export async function updateServiceProductTx(
  storeId: string,
  productId: string,
  product: Record<string, unknown>,
  service: Record<string, unknown>,
  staff: Record<string, unknown>[] = [],
  slots: Record<string, unknown>[] = [],
  resources: Record<string, unknown>[] = [],
  affiliate: Record<string, unknown> | null = null
): Promise<ProductCreateRpcResult> {
  const { data, error } = await rpc('update_service_product_tx', {
    p_store_id: storeId,
    p_product_id: productId,
    p_product: product,
    p_service: service,
    p_staff: staff,
    p_slots: slots,
    p_resources: resources,
    p_affiliate: affiliate,
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
