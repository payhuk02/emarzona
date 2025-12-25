/**
 * Types TypeScript pour l'intégration Moneroo
 * Remplace tous les `any` par des types explicites
 */

import { Currency } from "./currency-converter";

/**
 * Réponse de l'API Moneroo pour un checkout
 */
export interface MonerooCheckoutResponse {
  message: string;
  data: {
    id: string;
    checkout_url: string;
    transaction_id?: string;
  };
  errors: null | Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Réponse de l'API Moneroo pour un paiement
 */
export interface MonerooPaymentResponse {
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
  status?: number;
  statusCode?: number;
  contentType?: string;
  responseLength?: number;
  responsePreview?: string;
  hint?: string;
  error?: string | {
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
 * Réponse de vérification de paiement Moneroo
 */
export interface MonerooVerifyPaymentResponse {
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
 * Configuration Moneroo
 */
export interface MonerooConfig {
  timeout: number;
  maxRetries: number;
  retryBackoff: number;
  apiUrl: string;
}

/**
 * Options de retry
 */
export interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  retryableErrors?: string[];
}


