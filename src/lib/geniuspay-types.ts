/**
 * Types TypeScript pour l'intégration GeniusPay
 * Remplace tous les `any` par des types explicites
 */

/** Codes `payment_method` acceptés par l'API GeniusPay */
export type GeniusPayPaymentMethod =
  | 'pawapay'
  | 'wave'
  | 'orange_money'
  | 'mtn_money'
  | 'moov_money'
  | 'airtel_money'
  | 'paystack'
  | 'card';

/**
 * Réponse de l'API GeniusPay pour un checkout / paiement direct
 * - Sans `payment_method` → `checkout_url` (page GeniusPay)
 * - Avec `payment_method` → `payment_url` (gateway, ex. PawaPay)
 */
export interface GeniusPayCheckoutResponse {
  message?: string;
  success?: boolean;
  data: {
    id: string | number;
    reference?: string;
    checkout_url?: string;
    payment_url?: string;
    url?: string;
    transaction_id?: string;
    status?: string;
    gateway?: string;
    payment_method?: string;
  };
  errors?: null | Array<{
    field: string;
    message: string;
  }>;
  /** Injecté par notre Edge Function */
  _local_transaction_id?: string;
}

/**
 * Réponse de l'API GeniusPay pour un paiement
 */
export interface GeniusPayPaymentResponse {
  message: string;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    customer?: {
      email: string;
      first_name: string;
      last_name: string;
    };
    payment_method?: string;
    created_at: string;
    updated_at?: string;
  };
  errors: null | Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Réponse de l'Edge Function Supabase
 */
export interface SupabaseEdgeFunctionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
  status?: number;
}

/**
 * Structure d'erreur Supabase
 */
export interface SupabaseError {
  message: string;
  status?: number;
  statusText?: string;
  context?: Response | Record<string, unknown>;
  data?: unknown;
  body?: string | Record<string, unknown>;
  hint?: string;
  details?: string;
  code?: string;
}

/**
 * Détails d'erreur extraits
 */
export interface ExtractedErrorDetails {
  message: string;
  /** Détails techniques additionnels (parsing GeniusPay, etc.) */
  details?: unknown;
  status?: number;
  statusCode?: number;
  contentType?: string;
  responseLength?: number;
  responsePreview?: string;
  hint?: string;
  error?:
    | string
    | {
        message?: string;
      };
  raw?: string;
  troubleshooting?: {
    step1?: string;
    step2?: string;
    step3?: string;
    step4?: string;
  };
}

/**
 * Réponse de vérification de paiement GeniusPay
 */
export interface GeniusPayVerifyPaymentResponse {
  id: string;
  status: 'completed' | 'success' | 'failed' | 'pending' | 'processing' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  payment_method?: string;
  error_message?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Configuration GeniusPay
 */
export interface GeniusPayConfig {
  timeout: number;
  maxRetries: number;
  retryBackoff: number;
  apiUrl: string;
  /** Méthode de paiement envoyée à GeniusPay (défaut: pawapay) */
  defaultPaymentMethod: GeniusPayPaymentMethod;
}

/**
 * Options de retry
 */
export interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  retryableErrors?: string[];
}
