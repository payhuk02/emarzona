/**
 * Types pour le système de Gift Cards
 */

export enum GiftCardStatus {
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export enum GiftCardTransactionType {
  PURCHASE = 'purchase',
  REDEMPTION = 'redemption',
  REFUND = 'refund',
  EXPIRATION = 'expiration',
  ADJUSTMENT = 'adjustment'
}

export interface GiftCard {
  id: string;
  store_id: string;
  code: string;
  initial_amount: number;
  current_balance: number;
  status: GiftCardStatus;
  issued_at: string;
  expires_at?: string | null;
  redeemed_at?: string | null;
  purchased_by?: string | null;
  purchased_order_id?: string | null;
  recipient_email?: string | null;
  recipient_name?: string | null;
  recipient_message?: string | null;
  min_purchase_amount: number;
  applicable_to_product_types?: string[] | null;
  applicable_to_products?: string[] | null;
  applicable_to_stores?: string[] | null;
  can_be_partially_used: boolean;
  auto_activate: boolean;
  metadata?: Record<string, any>;
  notes?: string | null;
  times_used: number;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (optionnelles, chargées via join)
  store?: {
    id: string;
    name: string;
    slug: string;
  };
  purchased_by_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export interface GiftCardTransaction {
  id: string;
  gift_card_id: string;
  transaction_type: GiftCardTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id?: string | null;
  payment_id?: string | null;
  description?: string | null;
  reference_number?: string | null;
  user_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  
  // Relations (optionnelles)
  gift_card?: GiftCard;
  order?: {
    id: string;
    order_number: string;
    total_amount: number;
  };
}

export interface GiftCardValidationResult {
  is_valid: boolean;
  gift_card_id?: string;
  current_balance?: number;
  status?: GiftCardStatus;
  message: string;
}

export interface GiftCardRedemptionResult {
  success: boolean;
  amount_used: number;
  remaining_balance: number;
  message: string;
}

export interface CreateGiftCardInput {
  store_id: string;
  initial_amount: number;
  expires_at?: string | null;
  recipient_email?: string;
  recipient_name?: string;
  recipient_message?: string;
  min_purchase_amount?: number;
  applicable_to_product_types?: string[];
  applicable_to_products?: string[];
  applicable_to_stores?: string[];
  can_be_partially_used?: boolean;
  auto_activate?: boolean;
  metadata?: Record<string, any>;
  notes?: string;
}

export interface UpdateGiftCardInput {
  recipient_email?: string;
  recipient_name?: string;
  recipient_message?: string;
  expires_at?: string | null;
  status?: GiftCardStatus;
  min_purchase_amount?: number;
  can_be_partially_used?: boolean;
  notes?: string;
}

