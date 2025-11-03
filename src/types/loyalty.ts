// ============================================================================
// TYPES: Loyalty Program System
// ============================================================================

export type LoyaltyTierType = 'bronze' | 'silver' | 'gold' | 'platinum';

export type LoyaltyTransactionType = 
  | 'earned'      // Points gagnés
  | 'redeemed'    // Points échangés
  | 'expired'     // Points expirés
  | 'adjusted'    // Ajustement manuel
  | 'bonus'       // Bonus spécial
  | 'refunded';   // Points remboursés

export type LoyaltyRewardType = 
  | 'discount'        // Réduction
  | 'free_product'    // Produit gratuit
  | 'free_shipping'   // Livraison gratuite
  | 'gift_card'       // Carte cadeau
  | 'cash_back'       // Cashback
  | 'custom';         // Récompense personnalisée

export type LoyaltyRewardStatus = 'active' | 'inactive' | 'expired';

// ============================================================================
// LoyaltyTier (Configuration des tiers)
// ============================================================================

export interface LoyaltyTier {
  id: string;
  store_id: string;
  tier_type: LoyaltyTierType;
  name: string;
  description: string | null;
  min_points_required: number;
  min_orders_required: number | null;
  min_spent_amount: number | null;
  points_multiplier: number;
  discount_percentage: number;
  free_shipping: boolean;
  exclusive_access: boolean;
  badge_color: string;
  badge_icon: string | null;
  is_default: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LoyaltyPoints (Points d'un client)
// ============================================================================

export interface LoyaltyPoints {
  id: string;
  store_id: string;
  customer_id: string;
  total_points: number;
  available_points: number;
  lifetime_points: number;
  current_tier_id: string | null;
  current_tier_type: LoyaltyTierType;
  total_orders: number;
  total_spent: number;
  last_activity_at: string | null;
  points_expiring_soon: number;
  next_expiration_date: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations
  current_tier?: LoyaltyTier;
}

// ============================================================================
// LoyaltyTransaction (Transaction de points)
// ============================================================================

export interface LoyaltyTransaction {
  id: string;
  loyalty_points_id: string;
  store_id: string;
  customer_id: string;
  transaction_type: LoyaltyTransactionType;
  points_amount: number;
  balance_before: number;
  balance_after: number;
  order_id: string | null;
  reward_id: string | null;
  description: string | null;
  reference_number: string | null;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  created_by: string | null;
}

// ============================================================================
// LoyaltyReward (Récompense)
// ============================================================================

export interface LoyaltyReward {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  reward_type: LoyaltyRewardType;
  status: LoyaltyRewardStatus;
  points_cost: number;
  
  // Valeur de la récompense
  discount_percentage: number | null;
  discount_amount: number | null;
  free_product_id: string | null;
  gift_card_amount: number | null;
  cash_back_amount: number | null;
  custom_value: Record<string, any> | null;
  
  // Limitations
  max_redemptions: number | null;
  max_redemptions_per_customer: number | null;
  redemption_count: number;
  
  // Disponibilité
  available_from: string | null;
  available_until: string | null;
  
  // Conditions
  min_tier: LoyaltyTierType | null;
  applicable_to_product_types: string[];
  applicable_to_products: string[];
  
  // Visuel
  image_url: string | null;
  badge_text: string | null;
  
  // Configuration
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LoyaltyRewardRedemption (Échange de récompense)
// ============================================================================

export interface LoyaltyRewardRedemption {
  id: string;
  reward_id: string;
  loyalty_points_id: string;
  store_id: string;
  customer_id: string;
  points_used: number;
  redemption_code: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  used_at: string | null;
  expires_at: string | null;
  applied_to_order_id: string | null;
  applied_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  
  // Relations
  reward?: LoyaltyReward;
}

// ============================================================================
// Form Types
// ============================================================================

export interface CreateLoyaltyTierForm {
  tier_type: LoyaltyTierType;
  name: string;
  description?: string;
  min_points_required: number;
  min_orders_required?: number;
  min_spent_amount?: number;
  points_multiplier?: number;
  discount_percentage?: number;
  free_shipping?: boolean;
  exclusive_access?: boolean;
  badge_color?: string;
  badge_icon?: string;
  is_default?: boolean;
  display_order?: number;
}

export interface CreateLoyaltyRewardForm {
  name: string;
  description?: string;
  reward_type: LoyaltyRewardType;
  points_cost: number;
  
  // Valeur
  discount_percentage?: number;
  discount_amount?: number;
  free_product_id?: string;
  gift_card_amount?: number;
  cash_back_amount?: number;
  custom_value?: Record<string, any>;
  
  // Limitations
  max_redemptions?: number;
  max_redemptions_per_customer?: number;
  
  // Disponibilité
  available_from?: string;
  available_until?: string;
  
  // Conditions
  min_tier?: LoyaltyTierType;
  applicable_to_product_types?: string[];
  applicable_to_products?: string[];
  
  // Visuel
  image_url?: string;
  badge_text?: string;
}

// ============================================================================
// Stats & Filters
// ============================================================================

export interface LoyaltyStats {
  total_customers: number;
  total_points_issued: number;
  total_points_redeemed: number;
  active_rewards: number;
  total_redemptions: number;
  tier_distribution: Record<LoyaltyTierType, number>;
}

export interface LoyaltyFilters {
  store_id?: string;
  customer_id?: string;
  tier_type?: LoyaltyTierType;
  transaction_type?: LoyaltyTransactionType;
  date_from?: string;
  date_to?: string;
}

