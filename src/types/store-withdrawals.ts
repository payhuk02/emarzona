/**
 * Types pour le système de retrait des vendeurs (stores)
 */

export type StorePaymentMethod = 'mobile_money' | 'bank_card' | 'bank_transfer';

export type StoreWithdrawalStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface StoreEarnings {
  id: string;
  store_id: string;
  total_revenue: number;
  total_withdrawn: number;
  available_balance: number;
  platform_commission_rate: number;
  total_platform_commission: number;
  last_calculated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreWithdrawal {
  id: string;
  store_id: string;
  amount: number;
  currency: string;
  payment_method: StorePaymentMethod;
  payment_details: Record<string, unknown>;
  status: StoreWithdrawalStatus;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  processed_at: string | null;
  processed_by: string | null;
  transaction_reference: string | null;
  proof_url: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  store?: {
    id: string;
    name: string;
    slug: string;
    user_id: string;
  };
}

export interface StoreWithdrawalRequestForm {
  amount: number;
  payment_method: StorePaymentMethod;
  payment_details: MobileMoneyDetails | BankCardDetails | BankTransferDetails;
  notes?: string;
}

export type MobileMoneyOperator = 
  | 'orange_money' 
  | 'mtn_mobile_money' 
  | 'moov_money' 
  | 'wave' 
  | 'free_money'
  | 'm_pesa'
  | 'airtel_money'
  | 'ecocash'
  | 'other';

export interface MobileMoneyDetails {
  phone: string;
  operator: MobileMoneyOperator;
  country: string; // Code ISO du pays (ex: 'BF', 'CI', 'SN')
  full_name?: string;
}

export interface BankCardDetails {
  card_number: string; // Partiellement masqué côté client
  cardholder_name: string;
  expiry_month?: string;
  expiry_year?: string;
  bank_name?: string;
}

export interface BankTransferDetails {
  account_number: string;
  bank_name: string;
  account_holder_name: string;
  iban?: string;
  swift_code?: string;
  country?: string;
}

export interface StoreWithdrawalFilters {
  store_id?: string;
  status?: StoreWithdrawalStatus;
  payment_method?: StorePaymentMethod;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface StoreWithdrawalStats {
  total_withdrawals: number;
  total_amount: number;
  pending_count: number;
  pending_amount: number;
  completed_count: number;
  completed_amount: number;
  failed_count: number;
  failed_amount: number;
}

// Types pour les méthodes de paiement sauvegardées
export interface SavedStorePaymentMethod {
  id: string;
  store_id: string;
  payment_method: StorePaymentMethod;
  label: string;
  payment_details: MobileMoneyDetails | BankCardDetails | BankTransferDetails;
  is_default: boolean;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StorePaymentMethodForm {
  payment_method: StorePaymentMethod;
  label: string;
  payment_details: MobileMoneyDetails | BankCardDetails | BankTransferDetails;
  is_default?: boolean;
  is_active?: boolean;
  notes?: string;
}

// Types pour l'historique des changements de statut
export interface StoreWithdrawalStatusHistory {
  id: string;
  withdrawal_id: string;
  old_status: StoreWithdrawalStatus | null;
  new_status: StoreWithdrawalStatus;
  changed_by: string | null;
  change_reason: string | null;
  notes: string | null;
  created_at: string;
}

// Types pour les statistiques avancées
export interface WithdrawalTimeStats {
  average_processing_time_hours: number;
  average_completion_time_hours: number;
  fastest_processing_hours: number;
  slowest_processing_hours: number;
}

export interface WithdrawalPeriodStats {
  period: string; // '2025-01', '2025-02', etc.
  total_count: number;
  total_amount: number;
  completed_count: number;
  completed_amount: number;
  failed_count: number;
  failed_amount: number;
  success_rate: number; // Pourcentage
}

export interface WithdrawalAdvancedStats {
  total_withdrawals: number;
  total_amount: number;
  success_rate: number;
  average_amount: number;
  time_stats: WithdrawalTimeStats;
  period_stats: WithdrawalPeriodStats[];
  by_payment_method: {
    mobile_money: { count: number; amount: number; success_rate: number };
    bank_card: { count: number; amount: number; success_rate: number };
    bank_transfer: { count: number; amount: number; success_rate: number };
  };
}

