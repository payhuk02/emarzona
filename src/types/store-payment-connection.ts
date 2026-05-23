/**
 * Types connexions paiement vendeur (Payment Orchestration V2)
 * Alignés sur store_payment_connections — régénérer types Supabase après migration.
 */

export type PaymentProviderCode =
  | 'moneroo_platform'
  | 'stripe_connect'
  | 'paypal_commerce'
  | 'flutterwave_connect';

export type PaymentConnectionMode = 'platform_default' | 'oauth_connected';

export type PaymentConnectionStatus = 'pending' | 'active' | 'restricted' | 'disabled' | 'revoked';

export interface StorePaymentConnection {
  id: string;
  store_id: string;
  provider: PaymentProviderCode;
  connection_mode: PaymentConnectionMode;
  external_account_id: string | null;
  external_account_status: PaymentConnectionStatus;
  capabilities: Record<string, unknown>;
  default_currency: string | null;
  livemode: boolean;
  onboarding_completed_at?: string | null;
  last_synced_at?: string | null;
  metadata?: Record<string, unknown>;
}

/** Option retournée par get_store_payment_options */
export interface StorePaymentOption {
  provider: PaymentProviderCode;
  connection_id: string | null;
  label: string;
}

/** Code court utilisé côté checkout legacy (moneroo) */
export type CheckoutPaymentProviderLegacy = 'moneroo';

export function toLegacyCheckoutProvider(
  provider: PaymentProviderCode
): CheckoutPaymentProviderLegacy {
  if (provider === 'moneroo_platform') {
    return 'moneroo';
  }
  throw new Error(`Provider ${provider} not mapped to legacy checkout yet`);
}
