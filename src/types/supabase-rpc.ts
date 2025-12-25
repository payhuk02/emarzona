/**
 * Types pour les fonctions RPC Supabase
 * Ce fichier définit les types pour les fonctions RPC appelées dans l'application
 */

export interface CreateInvoiceFromOrderParams {
  p_order_id: string;
}

export interface CreateInvoiceFromOrderResult {
  invoice_id: string;
}

export interface ApplyCouponToOrderParams {
  p_coupon_id: string;
  p_order_id: string;
  p_customer_id: string;
  p_discount_amount: number;
}

export interface ApplyCouponToOrderResult {
  success: boolean;
  message?: string;
}

export interface RecordCouponUsageParams {
  promotion_id_param: string;
  order_id_param: string;
  discount_amount_param: number;
  original_amount_param: number;
  final_amount_param: number;
  session_id_param: string | null;
}

export interface RecordCouponUsageResult {
  success: boolean;
  message?: string;
}

export interface RedeemGiftCardParams {
  p_gift_card_id: string;
  p_order_id: string;
  p_amount: number;
}

export interface RedeemGiftCardResult {
  success: boolean;
  message?: string;
  remaining_balance?: number;
}

export interface MarkCartRecoveredParams {
  p_cart_id: string;
}

export interface MarkCartRecoveredResult {
  success: boolean;
  message?: string;
}

/**
 * Type helper pour les erreurs RPC
 */
export interface RpcError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Type helper pour les réponses RPC
 */
export type RpcResult<T> = {
  data: T | null;
  error: RpcError | null;
};







