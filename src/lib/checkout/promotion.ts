/**
 * Validation promotions checkout (product_promotions + validate_unified_promotion).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface ValidatedPromotion {
  promotionId: string;
  code: string;
  discountAmount: number;
  orderTotalBefore: number;
  orderTotalAfter: number;
}

export async function validateCheckoutPromotion(params: {
  code: string;
  storeId: string;
  productIds: string[];
  orderAmount: number;
  customerId?: string | null;
  isFirstOrder?: boolean;
}): Promise<{ valid: true; promotion: ValidatedPromotion } | { valid: false; message: string }> {
  const normalized = params.code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, message: 'Code promo requis' };
  }

  let categoryIds: string[] = [];
  if (params.productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('category_id')
      .in('id', params.productIds);
    categoryIds = [
      ...new Set(
        (products ?? []).map(p => p.category_id).filter((id): id is string => Boolean(id))
      ),
    ];
  }

  const { data, error } = await supabase.rpc('validate_unified_promotion', {
    p_code: normalized,
    p_store_id: params.storeId,
    p_product_ids: params.productIds.length > 0 ? params.productIds : null,
    p_category_ids: categoryIds.length > 0 ? categoryIds : null,
    p_collection_ids: null,
    p_order_amount: params.orderAmount,
    p_customer_id: params.customerId ?? null,
    p_is_first_order: params.isFirstOrder ?? false,
  });

  if (error) {
    logger.error('validate_unified_promotion failed', { error, code: normalized });
    return { valid: false, message: error.message || 'Validation impossible' };
  }

  const row = data as {
    valid?: boolean;
    error_message?: string;
    promotion_id?: string;
    code?: string;
    discount_amount?: number;
    order_total_before?: number;
    order_total_after?: number;
  } | null;

  if (!row?.valid || !row.promotion_id) {
    return {
      valid: false,
      message: row?.error_message || 'Code promo invalide ou expiré',
    };
  }

  const discountAmount = Number(row.discount_amount ?? 0);
  return {
    valid: true,
    promotion: {
      promotionId: row.promotion_id,
      code: row.code ?? normalized,
      discountAmount,
      orderTotalBefore: Number(row.order_total_before ?? params.orderAmount),
      orderTotalAfter: Number(row.order_total_after ?? params.orderAmount - discountAmount),
    },
  };
}
