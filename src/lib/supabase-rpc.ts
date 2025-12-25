/**
 * Helpers typés pour les appels RPC Supabase
 * Ce fichier fournit des fonctions wrapper typées pour les appels RPC
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  CreateInvoiceFromOrderParams,
  CreateInvoiceFromOrderResult,
  ApplyCouponToOrderParams,
  ApplyCouponToOrderResult,
  RecordCouponUsageParams,
  RecordCouponUsageResult,
  RedeemGiftCardParams,
  RedeemGiftCardResult,
  MarkCartRecoveredParams,
  MarkCartRecoveredResult,
} from '@/types/supabase-rpc';

/**
 * Helper pour les appels RPC non-typés dans le schéma Supabase
 * Les fonctions RPC custom ne sont pas toujours générées dans les types
 */
type RpcFunction = (fn: string, params: Record<string, unknown>) => Promise<{
  data: unknown;
  error: { message?: string } | null;
}>;

const rpc = supabase.rpc.bind(supabase) as unknown as RpcFunction;

/**
 * Créer une facture à partir d'une commande
 */
export async function createInvoiceFromOrder(
  params: CreateInvoiceFromOrderParams
): Promise<{ data: CreateInvoiceFromOrderResult | null; error: Error | null }> {
  try {
    const { data, error } = await rpc('create_invoice_from_order', params);
    if (error) {
      return { data: null, error: new Error(error.message || 'Failed to create invoice') };
    }
    return { data: data as CreateInvoiceFromOrderResult, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Appliquer un coupon à une commande
 */
export async function applyCouponToOrder(
  params: ApplyCouponToOrderParams
): Promise<{ data: ApplyCouponToOrderResult | null; error: Error | null }> {
  try {
    const { data, error } = await rpc('apply_coupon_to_order', params);
    if (error) {
      return { data: null, error: new Error(error.message || 'Failed to apply coupon') };
    }
    return { data: data as ApplyCouponToOrderResult, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Enregistrer l'utilisation d'un coupon
 */
export async function recordCouponUsage(
  params: RecordCouponUsageParams
): Promise<{ data: RecordCouponUsageResult | null; error: Error | null }> {
  try {
    const { data, error } = await rpc('record_coupon_usage', params);
    if (error) {
      return { data: null, error: new Error(error.message || 'Failed to record coupon usage') };
    }
    return { data: data as RecordCouponUsageResult, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Rédimer une carte cadeau
 */
export async function redeemGiftCard(
  params: RedeemGiftCardParams
): Promise<{ data: RedeemGiftCardResult[] | null; error: Error | null }> {
  try {
    const { data, error } = await rpc('redeem_gift_card', params);
    if (error) {
      return { data: null, error: new Error(error.message || 'Failed to redeem gift card') };
    }
    return { data: data as RedeemGiftCardResult[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Marquer un panier comme récupéré
 */
export async function markCartRecovered(
  params: MarkCartRecoveredParams
): Promise<{ data: MarkCartRecoveredResult | null; error: Error | null }> {
  try {
    const { data, error } = await rpc('mark_cart_recovered', params);
    if (error) {
      return { data: null, error: new Error(error.message || 'Failed to mark cart as recovered') };
    }
    return { data: data as MarkCartRecoveredResult, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}







