/**
 * Types tables service_cancellation_* (complément types.ts générés).
 * Utilisés par cancellation-policy et useCancellationPolicy.
 */

export interface ServiceCancellationPolicyRow {
  id: string;
  product_id: string;
  store_id: string;
  policy_name: string;
  refund_rules: Array<{
    hours_before: number;
    refund_percentage: number;
    description?: string;
  }>;
  allow_same_day_cancellation: boolean;
  same_day_refund_percentage: number;
  allow_emergency_cancellation: boolean;
  emergency_refund_percentage: number;
  emergency_reasons: string[];
  cancellation_fee_enabled: boolean;
  cancellation_fee_amount: number;
  cancellation_fee_percentage: number;
  allow_store_credit: boolean;
  store_credit_bonus_percentage: number;
  refund_processing_days: number;
  auto_refund_enabled: boolean;
  auto_refund_minimum_hours: number;
  is_active: boolean;
  is_default: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCancellationRefundRow {
  id: string;
  booking_id: string;
  policy_id?: string | null;
  original_amount: number;
  refund_percentage: number;
  refund_amount: number;
  cancellation_fee: number;
  net_refund_amount: number;
  refund_method: 'original_payment' | 'store_credit' | 'bank_transfer' | 'check';
  hours_before_service: number;
  cancellation_reason?: string | null;
  is_emergency: boolean;
  emergency_reason?: string | null;
  original_order_id?: string | null;
  original_payment_id?: string | null;
  refund_transaction_id?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requested_at: string;
  processed_at?: string | null;
  completed_at?: string | null;
  admin_notes?: string | null;
  customer_notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}
