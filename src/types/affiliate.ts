// =========================================================
// Types pour le système d'affiliation
// Date : 25/10/2025
// Description : Types TypeScript pour le système d'affiliation complet
// =========================================================

export type AffiliateStatus = 'active' | 'suspended' | 'pending';
export type CommissionType = 'percentage' | 'fixed';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'mobile_money' | 'bank_transfer' | 'paypal' | 'stripe';
export type LinkStatus = 'active' | 'paused' | 'deleted';

// ==============================================
// AFFILIATE (Affilié)
// ==============================================

export interface Affiliate {
  id: string;
  user_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  affiliate_code: string;
  
  // Stats
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission_earned: number;
  total_commission_paid: number;
  pending_commission: number;
  
  // Payment info
  payment_method?: PaymentMethod;
  payment_details?: Record<string, any>;
  
  // Status
  status: AffiliateStatus;
  suspension_reason?: string;
  suspended_at?: string;
  
  // Dates
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// ==============================================
// PRODUCT AFFILIATE SETTINGS
// ==============================================

export interface ProductAffiliateSettings {
  id: string;
  product_id: string;
  store_id: string;
  
  // Configuration
  affiliate_enabled: boolean;
  commission_rate: number;
  commission_type: CommissionType;
  fixed_commission_amount?: number;
  
  // Tracking
  cookie_duration_days: number;
  
  // Restrictions
  max_commission_per_sale?: number;
  min_order_amount: number;
  allow_self_referral: boolean;
  require_approval: boolean;
  
  // Content
  terms_and_conditions?: string;
  promotional_materials?: Record<string, any>;
  
  // Dates
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relations (optionnel)
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url?: string;
  };
}

// ==============================================
// AFFILIATE LINK
// ==============================================

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  product_id: string;
  store_id: string;
  
  // Link
  link_code: string;
  full_url: string;
  
  // Stats
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission: number;
  
  // Tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  custom_parameters?: Record<string, any>;
  
  // Status
  status: LinkStatus;
  
  // Dates
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  
  // Relations (optionnel)
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url?: string;
    store?: {
      name: string;
      slug: string;
    };
  };
  affiliate?: {
    display_name?: string;
    affiliate_code: string;
  };
}

// ==============================================
// AFFILIATE CLICK
// ==============================================

export interface AffiliateClick {
  id: string;
  affiliate_link_id: string;
  affiliate_id: string;
  product_id: string;
  
  // Visitor info
  ip_address?: string;
  user_agent?: string;
  referer_url?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  
  // Tracking
  tracking_cookie: string;
  cookie_expires_at: string;
  
  // Conversion
  converted: boolean;
  order_id?: string;
  converted_at?: string;
  
  // Dates
  clicked_at: string;
  created_at: string;
}

// ==============================================
// AFFILIATE COMMISSION
// ==============================================

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  affiliate_link_id: string;
  product_id: string;
  store_id: string;
  order_id: string;
  payment_id?: string;
  
  // Amounts
  order_total: number;
  commission_base: number;
  commission_rate: number;
  commission_type: CommissionType;
  commission_amount: number;
  
  // Status
  status: CommissionStatus;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  
  // Payment
  paid_at?: string;
  paid_by?: string;
  payment_method?: string;
  payment_reference?: string;
  payment_proof_url?: string;
  
  // Meta
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations (optionnel)
  product?: {
    name: string;
    image_url?: string;
  };
  affiliate?: {
    display_name?: string;
    email: string;
    affiliate_code: string;
  };
  order?: {
    order_number: string;
  };
}

// ==============================================
// AFFILIATE WITHDRAWAL
// ==============================================

export interface AffiliateWithdrawal {
  id: string;
  affiliate_id: string;
  
  // Amount
  amount: number;
  currency: string;
  
  // Payment method
  payment_method: PaymentMethod;
  payment_details: Record<string, any>;
  
  // Status
  status: WithdrawalStatus;
  
  // Approval
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  
  // Processing
  processed_at?: string;
  processed_by?: string;
  transaction_reference?: string;
  proof_url?: string;
  
  // Failure
  failed_at?: string;
  failure_reason?: string;
  
  // Notes
  notes?: string;
  admin_notes?: string;
  
  // Dates
  created_at: string;
  updated_at: string;
  
  // Relations (optionnel)
  affiliate?: {
    display_name?: string;
    email: string;
    affiliate_code: string;
  };
}

// ==============================================
// FORMS DATA
// ==============================================

export interface AffiliateRegistrationForm {
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  password?: string;
  payment_method?: PaymentMethod;
  payment_details?: Record<string, any>;
}

export interface ProductAffiliateSettingsForm {
  affiliate_enabled: boolean;
  commission_rate: number;
  commission_type: CommissionType;
  fixed_commission_amount?: number;
  cookie_duration_days: number;
  max_commission_per_sale?: number;
  min_order_amount: number;
  allow_self_referral: boolean;
  require_approval: boolean;
  terms_and_conditions?: string;
  promotional_materials?: Record<string, any>;
}

export interface CreateAffiliateLinkForm {
  product_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  custom_parameters?: Record<string, any>;
}

export interface WithdrawalRequestForm {
  amount: number;
  payment_method: PaymentMethod;
  payment_details: Record<string, any>;
  notes?: string;
}

export interface ApproveCommissionForm {
  commission_id: string;
  notes?: string;
}

export interface RejectCommissionForm {
  commission_id: string;
  rejection_reason: string;
}

export interface PayCommissionForm {
  commission_id: string;
  payment_method: string;
  payment_reference: string;
  payment_proof_url?: string;
  notes?: string;
}

// ==============================================
// STATS
// ==============================================

export interface AffiliateStats {
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission_earned: number;
  total_commission_paid: number;
  pending_commission: number;
  available_for_withdrawal: number;
  conversion_rate: number;
  average_order_value: number;
  average_commission_per_sale: number;
}

export interface ProductAffiliateStats {
  product_id: string;
  product_name: string;
  total_affiliates: number;
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission_paid: number;
  conversion_rate: number;
}

export interface StoreAffiliateStats {
  store_id: string;
  total_products_with_affiliate: number;
  total_affiliates: number;
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission_paid: number;
  conversion_rate: number;
}

export interface AdminAffiliateStats {
  total_affiliates: number;
  active_affiliates: number;
  suspended_affiliates: number;
  total_products_with_affiliate: number;
  total_links: number;
  total_clicks: number;
  total_sales: number;
  total_revenue: number;
  total_commission_earned: number;
  total_commission_paid: number;
  pending_commission: number;
  pending_withdrawals: number;
  total_withdrawals_amount: number;
}

// ==============================================
// FILTERS
// ==============================================

export interface AffiliateFilters {
  status?: AffiliateStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  min_sales?: number;
  min_revenue?: number;
}

export interface CommissionFilters {
  status?: CommissionStatus;
  affiliate_id?: string;
  product_id?: string;
  store_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface WithdrawalFilters {
  status?: WithdrawalStatus;
  affiliate_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  payment_method?: PaymentMethod;
}

export interface LinkFilters {
  status?: LinkStatus;
  affiliate_id?: string;
  product_id?: string;
  store_id?: string;
  search?: string;
}

// ==============================================
// PAGINATION
// ==============================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==============================================
// API RESPONSES
// ==============================================

export interface TrackClickResponse {
  success: boolean;
  tracking_cookie?: string;
  expires_at?: string;
  product_id?: string;
  store_id?: string;
  click_id?: string;
  redirect_url?: string;
  error?: string;
}

export interface GenerateCodeResponse {
  success: boolean;
  code?: string;
  error?: string;
}

export interface AffiliateRegistrationResponse {
  success: boolean;
  affiliate?: Affiliate;
  error?: string;
}

export interface CreateLinkResponse {
  success: boolean;
  link?: AffiliateLink;
  error?: string;
}

// ==============================================
// DASHBOARD DATA
// ==============================================

export interface AffiliateDashboardData {
  affiliate: Affiliate;
  stats: AffiliateStats;
  recentLinks: AffiliateLink[];
  recentCommissions: AffiliateCommission[];
  recentClicks: AffiliateClick[];
  pendingWithdrawals: AffiliateWithdrawal[];
  topProducts: ProductAffiliateStats[];
}

export interface StoreAffiliateDashboardData {
  store_id: string;
  stats: StoreAffiliateStats;
  topAffiliates: Array<{
    affiliate: Affiliate;
    stats: {
      clicks: number;
      sales: number;
      revenue: number;
      commission: number;
    };
  }>;
  topProducts: ProductAffiliateStats[];
  recentCommissions: AffiliateCommission[];
  pendingCommissions: AffiliateCommission[];
}

// ==============================================
// CHART DATA
// ==============================================

export interface ChartDataPoint {
  date: string;
  clicks?: number;
  sales?: number;
  revenue?: number;
  commission?: number;
  conversion_rate?: number;
}

export interface AffiliatePerformanceChart {
  period: 'day' | 'week' | 'month' | 'year';
  data: ChartDataPoint[];
}

// ==============================================
// NOTIFICATION TYPES
// ==============================================

export interface AffiliateNotification {
  id: string;
  affiliate_id: string;
  type: 'new_sale' | 'commission_approved' | 'commission_paid' | 'withdrawal_approved' | 'withdrawal_completed' | 'new_product_available';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

// ==============================================
// VALIDATION SCHEMAS (pour react-hook-form + zod)
// ==============================================

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  data: T;
  errors: ValidationErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

// ==============================================
// HELPER TYPES
// ==============================================

export type AffiliateSortBy = 'created_at' | 'total_sales' | 'total_revenue' | 'total_commission_earned' | 'conversion_rate';
export type CommissionSortBy = 'created_at' | 'commission_amount' | 'order_total' | 'status';
export type LinkSortBy = 'created_at' | 'total_clicks' | 'total_sales' | 'total_revenue' | 'conversion_rate';
export type WithdrawalSortBy = 'created_at' | 'amount' | 'status';

